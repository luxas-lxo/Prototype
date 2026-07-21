const clickGlowVert = `
  precision mediump float;

  attribute vec3 aPosition;
  attribute vec2 aTexCoord;

  varying vec2 vTexCoord;

  void main() {
    vTexCoord = aTexCoord;

    vec4 positionVec4 =
      vec4(aPosition, 1.0);

    positionVec4.xy =
      positionVec4.xy * 2.0 - 1.0;

    gl_Position =
      positionVec4;
  }
`;

const clickGlowFrag = `
  precision mediump float;

  varying vec2 vTexCoord;

  uniform vec2 u_resolution;
  uniform vec2 u_position;
  uniform float u_radius;
  uniform float u_alpha;
  uniform vec3 u_color;

  void main() {
    vec2 pixelPosition =
      vec2(
        vTexCoord.x * u_resolution.x,
        (1.0 - vTexCoord.y) * u_resolution.y
      );

    float distanceToCenter =
      distance(
        pixelPosition,
        u_position
      );

    if (distanceToCenter >= u_radius) {
      gl_FragColor =
        vec4(0.0);

      return;
    }

    float normalizedDistance =
      distanceToCenter /
      max(u_radius, 0.0001);

    float glow =
      1.0 -
      smoothstep(
        0.0,
        1.0,
        normalizedDistance
      );

    glow =
      pow(
        glow,
        2.4
      );

    float finalAlpha =
      glow *
      u_alpha;

    // Premultiply the color so transparent pixels cannot brighten the scene.
    gl_FragColor =
      vec4(
        u_color * finalAlpha,
        finalAlpha
      );
  }
`;