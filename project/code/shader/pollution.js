const pollutionParticleVert = `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);

  vec4 position = vec4(aPosition, 1.0);
  position.xy = position.xy * 2.0 - 1.0;

  gl_Position = position;
}
`;

const pollutionParticleFrag = `
precision mediump float;

#define MAX_PARTICLES 256
#define SHARD_VERTEX_COUNT 8

uniform vec2 u_resolution;
uniform int u_particleCount;

uniform vec4 u_particles[MAX_PARTICLES];
uniform vec4 u_particleData[MAX_PARTICLES];

uniform vec3 u_color;
uniform float u_opacity;

varying vec2 vTexCoord;

const float PI = 3.14159265359;
const float TWO_PI = 6.28318530718;

float hash(float value) {
  return fract(
    sin(value * 127.1) *
    43758.5453123
  );
}

mat2 rotate2D(float angle) {
  float cosine = cos(angle);
  float sine = sin(angle);

  return mat2(
    cosine,
    -sine,
    sine,
    cosine
  );
}

float sdSegment(
  vec2 position,
  vec2 start,
  vec2 end
) {
  vec2 localPosition =
    position - start;

  vec2 segment =
    end - start;

  float projection = clamp(
    dot(localPosition, segment) /
    max(dot(segment, segment), 0.0001),
    0.0,
    1.0
  );

  return length(
    localPosition -
    segment * projection
  );
}

vec2 getShardVertex(
  int index,
  vec2 halfSize,
  float seed
) {
  float vertexIndex =
    float(index);

  float angle =
    vertexIndex /
    float(SHARD_VERTEX_COUNT) *
    TWO_PI;

  float angleJitter =
    (
      hash(
        seed +
        vertexIndex * 17.13
      ) -
      0.5
    ) *
    0.42;

  angle += angleJitter;

  float radius =
    mix(
      0.68,
      1.0,
      hash(
        seed +
        vertexIndex * 31.71
      )
    );

  int notchA = int(
    floor(
      hash(seed + 41.7) *
      float(SHARD_VERTEX_COUNT)
    )
  );

  int notchB = int(
    mod(
      float(notchA) +
      2.0 +
      floor(hash(seed + 83.2) * 4.0),
      float(SHARD_VERTEX_COUNT)
    )
  );

  int notchC = int(
    mod(
      float(notchA) +
      5.0 +
      floor(hash(seed + 109.4) * 2.0),
      float(SHARD_VERTEX_COUNT)
    )
  );

  if (
    index == notchA ||
    index == notchB
  ) {
    radius *= mix(
      0.18,
      0.42,
      hash(
        seed +
        vertexIndex * 53.9
      )
    );
  }

  if (
    index == notchC &&
    hash(seed + 62.8) > 0.45
  ) {
    radius *= 0.48;
  }

  return vec2(
    cos(angle),
    sin(angle)
  ) * halfSize * radius;
}

float sdConcaveShard(
  vec2 position,
  vec2 halfSize,
  float seed
) {
  vec2 previousVertex =
    getShardVertex(
      SHARD_VERTEX_COUNT - 1,
      halfSize,
      seed
    );

  float minimumDistance =
    dot(
      position - previousVertex,
      position - previousVertex
    );

  float signValue = 1.0;

  for (
    int i = 0;
    i < SHARD_VERTEX_COUNT;
    i++
  ) {
    vec2 currentVertex =
      getShardVertex(
        i,
        halfSize,
        seed
      );

    vec2 edge =
      previousVertex -
      currentVertex;

    vec2 relativePosition =
      position -
      currentVertex;

    vec2 nearestPosition =
      relativePosition -
      edge *
      clamp(
        dot(relativePosition, edge) /
        max(dot(edge, edge), 0.0001),
        0.0,
        1.0
      );

    minimumDistance = min(
      minimumDistance,
      dot(
        nearestPosition,
        nearestPosition
      )
    );

    bool conditionA =
      position.y >= currentVertex.y;

    bool conditionB =
      position.y < previousVertex.y;

    bool conditionC =
      edge.x * relativePosition.y >
      edge.y * relativePosition.x;

    if (
      (
        conditionA &&
        conditionB &&
        conditionC
      ) ||
      (
        !conditionA &&
        !conditionB &&
        !conditionC
      )
    ) {
      signValue *= -1.0;
    }

    previousVertex =
      currentVertex;
  }

  return signValue *
    sqrt(minimumDistance);
}

float sdOpenFragment(
  vec2 position,
  vec2 halfSize,
  float seed
) {
  vec2 vertex0 =
    getShardVertex(
      0,
      halfSize,
      seed
    );

  vec2 vertex1 =
    getShardVertex(
      1,
      halfSize,
      seed
    );

  vec2 vertex2 =
    getShardVertex(
      2,
      halfSize,
      seed
    );

  vec2 vertex3 =
    getShardVertex(
      3,
      halfSize,
      seed
    );

  vec2 vertex4 =
    getShardVertex(
      4,
      halfSize,
      seed
    );

  vec2 vertex5 =
    getShardVertex(
      5,
      halfSize,
      seed
    );

  vec2 vertex6 =
    getShardVertex(
      6,
      halfSize,
      seed
    );

  float distanceField =
    sdSegment(
      position,
      vertex0,
      vertex1
    );

  distanceField = min(
    distanceField,
    sdSegment(
      position,
      vertex1,
      vertex2
    )
  );

  if (hash(seed + 14.2) > 0.35) {
    distanceField = min(
      distanceField,
      sdSegment(
        position,
        vertex2,
        vertex3
      )
    );
  }

  distanceField = min(
    distanceField,
    sdSegment(
      position,
      vertex4,
      vertex5
    )
  );

  distanceField = min(
    distanceField,
    sdSegment(
      position,
      vertex5,
      vertex6
    )
  );

  if (hash(seed + 71.6) > 0.55) {
    distanceField = min(
      distanceField,
      sdSegment(
        position,
        vertex3,
        vertex5
      )
    );
  }

  float thickness =
    mix(
      0.55,
      1.25,
      hash(seed + 94.3)
    );

  return distanceField -
    thickness;
}

void main() {
  vec2 pixelPosition =
    vTexCoord *
    u_resolution;

  float accumulatedAlpha = 0.0;

  for (
    int i = 0;
    i < MAX_PARTICLES;
    i++
  ) {
    if (i >= u_particleCount) {
      break;
    }

    vec4 particle =
      u_particles[i];

    vec4 data =
      u_particleData[i];

    vec2 particlePosition =
      particle.xy;

    vec2 particleSize =
      vec2(
        particle.z,
        particle.w
      );

    float rotation =
      data.x;

    float shapeType =
      data.y;

    float particleOpacity =
      data.z;

    float seed =
      data.w;

    vec2 localPosition =
      pixelPosition -
      particlePosition;

    localPosition =
      rotate2D(-rotation) *
      localPosition;

    vec2 halfSize =
      particleSize * 0.5;

    float boundingRadius =
      length(halfSize) + 2.0;

    float squaredDistance =
      dot(
        localPosition,
        localPosition
      );

    bool hasValidSize =
      particleSize.x > 0.0 &&
      particleSize.y > 0.0;

    bool isInsideBounds =
      squaredDistance <=
      boundingRadius * boundingRadius;

    if (
      hasValidSize &&
      isInsideBounds
    ) {
      float distanceField = 100000.0;

      if (shapeType < 0.5) {
        distanceField =
          sdConcaveShard(
            localPosition,
            halfSize,
            seed
          );
      } else {
        distanceField =
          sdOpenFragment(
            localPosition,
            halfSize,
            seed
          );
      }

      float edgeSoftness = 0.8;

      float shapeAlpha =
        1.0 -
        smoothstep(
          0.0,
          edgeSoftness,
          distanceField
        );

      accumulatedAlpha +=
        shapeAlpha *
        particleOpacity *
        u_opacity;
    }
  }

  accumulatedAlpha =
    clamp(
      accumulatedAlpha,
      0.0,
      1.0
    );

  gl_FragColor =
    vec4(
      u_color *
      accumulatedAlpha,
      accumulatedAlpha
    );
}
`;

const pollutionPostVert = `
precision mediump float;

attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {
  vTexCoord = vec2(
    aTexCoord.x,
    1.0 - aTexCoord.y
  );

  vec4 position =
    vec4(aPosition, 1.0);

  position.xy =
    position.xy * 2.0 - 1.0;

  gl_Position =
    position;
}
`;

const pollutionPostFrag = `
precision mediump float;

uniform sampler2D u_scene;
uniform sampler2D u_pollutionMask;
uniform float u_strength;

varying vec2 vTexCoord;

void main() {
  vec2 sceneUv =
    vTexCoord;

  vec2 maskUv = vec2(
    vTexCoord.x,
    1.0 - vTexCoord.y
  );

  // Read the already rendered scene.
  vec4 sceneColor =
    texture2D(
      u_scene,
      sceneUv
    );

  float pollutionSample =
    texture2D(
      u_pollutionMask,
      maskUv
    ).r;

  float pollutionAmount =
    clamp(
      pollutionSample *
      2.0 *
      u_strength,
      0.0,
      1.0
    );

  // Background color defined by background(3, 8, 14).
  vec3 backgroundColor =
    vec3(
      3.0 / 255.0,
      8.0 / 255.0,
      14.0 / 255.0
    );

  // Protect the base background while preserving foreground elements.
  float backgroundDifference =
    distance(
      sceneColor.rgb,
      backgroundColor
    );

  float foregroundAmount =
    smoothstep(
      0.015,
      0.08,
      backgroundDifference
    );

  pollutionAmount *=
    foregroundAmount;

  // Calculate the perceived brightness of the original scene.
  float luminance =
    dot(
      sceneColor.rgb,
      vec3(
        0.299,
        0.587,
        0.114
      )
    );

  // Remove the warm source color before applying the blue-gray tint.
  vec3 neutralColor =
    vec3(luminance);

  // Define a dark-to-light blue-gray palette.
  vec3 darkPollutionColor =
    vec3(
      24.0 / 255.0,
      39.0 / 255.0,
      88.0 / 255.0
    );

  vec3 lightPollutionColor =
    vec3(
      152.0 / 255.0,
      169.0 / 255.0,
      193.0 / 255.0
    );

  // Preserve scene brightness while replacing its hue.
  float adjustedLuminance =
    smoothstep(
      0.0,
      0.85,
      luminance
    );

  vec3 blueGrayColor =
    mix(
      darkPollutionColor,
      lightPollutionColor,
      adjustedLuminance
    );

  float finalPollutionAmount =
    pollutionAmount * 0.85;

  // First remove the original chroma.
  vec3 desaturatedScene =
    mix(
      sceneColor.rgb,
      neutralColor,
      finalPollutionAmount
    );

  vec3 finalColor =
    mix(
      desaturatedScene,
      blueGrayColor,
      finalPollutionAmount
    );

  gl_FragColor =
    vec4(
      finalColor,
      sceneColor.a
    );
}
`;