const coralGlowVert = `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = vec2(
    aTexCoord.x,
    1.0 - aTexCoord.y
  );

  vec4 position = vec4(
    aPosition,
    1.0
  );

  position.xy =
    position.xy * 2.0 - 1.0;

  gl_Position = position;
}
`;

const coralGlowFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_radius;
uniform float u_strength;
uniform float u_grainStrength;
uniform float u_edgeVariation;

varying vec2 vTexCoord;


/**
 * Generates a deterministic pseudo-random value from a two-dimensional
 * coordinate.
 */
float random2D(vec2 coordinate) {
  return fract(
    sin(
      dot(
        coordinate,
        vec2(
          12.9898,
          78.233
        )
      )
    ) *
    43758.5453
  );
}


/**
 * Generates smooth value noise.
 */
float valueNoise(vec2 coordinate) {
  vec2 integerPosition =
    floor(coordinate);

  vec2 fractionalPosition =
    fract(coordinate);

  fractionalPosition =
    fractionalPosition *
    fractionalPosition *
    (
      3.0 -
      2.0 *
      fractionalPosition
    );

  float bottomLeft =
    random2D(
      integerPosition
    );

  float bottomRight =
    random2D(
      integerPosition +
      vec2(1.0, 0.0)
    );

  float topLeft =
    random2D(
      integerPosition +
      vec2(0.0, 1.0)
    );

  float topRight =
    random2D(
      integerPosition +
      vec2(1.0, 1.0)
    );

  float bottom =
    mix(
      bottomLeft,
      bottomRight,
      fractionalPosition.x
    );

  float top =
    mix(
      topLeft,
      topRight,
      fractionalPosition.x
    );

  return mix(
    bottom,
    top,
    fractionalPosition.y
  );
}


/**
 * Combines several noise frequencies to create organic pigment variation.
 */
float fractalNoise(vec2 coordinate) {
  float result = 0.0;
  float amplitude = 0.5;

  for (
    int octave = 0;
    octave < 4;
    octave++
  ) {
    result +=
      valueNoise(coordinate) *
      amplitude;

    coordinate =
      coordinate * 2.03 +
      vec2(
        17.1,
        9.2
      );

    amplitude *= 0.5;
  }

  return result;
}


void main() {
  vec2 texel =
    1.0 /
    u_resolution;

  // Create slowly moving noise used to disturb the watercolor edge.
  float largeNoise =
    fractalNoise(
      vTexCoord *
      vec2(
        7.0,
        5.0
      ) +
      vec2(
        u_time * 0.008,
        -u_time * 0.006
      )
    );

  float fineNoise =
    fractalNoise(
      vTexCoord *
      vec2(
        28.0,
        22.0
      ) -
      vec2(
        u_time * 0.012,
        u_time * 0.009
      )
    );

  vec2 distortion = vec2(
    largeNoise - 0.5,
    fineNoise - 0.5
  );

  distortion *=
    texel *
    u_radius *
    u_edgeVariation;

  vec2 distortedUv =
    vTexCoord +
    distortion;

  vec2 horizontalOffset =
    vec2(
      texel.x *
      u_radius,
      0.0
    );

  vec2 verticalOffset =
    vec2(
      0.0,
      texel.y *
      u_radius
    );

  vec2 diagonalOffsetA =
    horizontalOffset +
    verticalOffset;

  vec2 diagonalOffsetB =
    horizontalOffset -
    verticalOffset;

  // Inner pigment layer.
  vec4 center =
    texture2D(
      u_texture,
      distortedUv
    ) *
    0.18;

  // Medium watercolor bleed.
  vec4 mediumBlur =
    center;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv +
      horizontalOffset
    ) *
    0.09;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv -
      horizontalOffset
    ) *
    0.09;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv +
      verticalOffset
    ) *
    0.09;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv -
      verticalOffset
    ) *
    0.09;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv +
      diagonalOffsetA
    ) *
    0.06;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv -
      diagonalOffsetA
    ) *
    0.06;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv +
      diagonalOffsetB
    ) *
    0.06;

  mediumBlur +=
    texture2D(
      u_texture,
      distortedUv -
      diagonalOffsetB
    ) *
    0.06;

  // Wider secondary wash.
  vec2 wideHorizontalOffset =
    horizontalOffset * 2.2;

  vec2 wideVerticalOffset =
    verticalOffset * 2.2;

  vec4 wideBlur =
    texture2D(
      u_texture,
      distortedUv +
      wideHorizontalOffset
    ) *
    0.045;

  wideBlur +=
    texture2D(
      u_texture,
      distortedUv -
      wideHorizontalOffset
    ) *
    0.045;

  wideBlur +=
    texture2D(
      u_texture,
      distortedUv +
      wideVerticalOffset
    ) *
    0.045;

  wideBlur +=
    texture2D(
      u_texture,
      distortedUv -
      wideVerticalOffset
    ) *
    0.045;

  vec4 watercolor =
    mediumBlur +
    wideBlur;

    // Create softer, less luminous pigment variation.
  float pigmentDensity =
    mix(
      0.78,
      1.02,
      largeNoise
    );

  float pigmentBreakup =
    mix(
      0.88,
      1.02,
      fineNoise
    );

  watercolor.rgb *=
    pigmentDensity *
    pigmentBreakup;

  watercolor.a *=
    mix(
      0.52,
      0.82,
      largeNoise
    );

  // Add very subtle paper-like grain.
  float grain =
    random2D(
      gl_FragCoord.xy +
      u_time
    ) - 0.5;

  watercolor.rgb +=
    grain *
    u_grainStrength *
    watercolor.a;

  // Stronger desaturation for a pigment-like look.
  float luminance =
    dot(
      watercolor.rgb,
      vec3(
        0.299,
        0.587,
        0.114
      )
    );

  watercolor.rgb =
    mix(
      vec3(luminance),
      watercolor.rgb,
      0.62
    );

  // Compress bright color values to avoid a neon glow impression.
  watercolor.rgb *= 0.78;

  gl_FragColor = vec4(
    watercolor.rgb * u_strength,
    watercolor.a * u_strength
  );
}
`;