let fishSwarms = [];
let clickGlows = [];
let clickForces = [];

let codTable;
//let codSwarms = [];

let currentYear = 1970;
let yearSpeed = 0.02;

let trailLayer;

let fishShader;
let shaderLayer;
let codSwarms = [];

const MAX_SHADER_PARTICLES = 80;
const MAX_SHADER_GLOWS = 8;

let stage = 0;
let aquarium;
const rand = 0.15;

let frameRateP;

const WORLD = {
  w: 280 * 2,
  h: 220 * 2,
  d: 260 * 2
};

const fishVert = `
precision mediump float;

attribute vec3 aPosition;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

const fishFrag = `
precision mediump float;

uniform vec2 u_resolution;

uniform int u_count;
uniform vec4 u_particles[80];
// x, y, size, angle

uniform vec4 u_particleData[80];
// alpha, unused, unused, unused

uniform int u_glowCount;
uniform vec4 u_glows[8];
// x, y, radius, strength

void main() {
  vec2 uv = vec2(
    gl_FragCoord.x,
    u_resolution.y - gl_FragCoord.y
  );

  vec3 col = vec3(0.0);
  float outAlpha = 0.0;

  for (int i = 0; i < 80; i++) {
    if (i >= u_count) break;

    vec4 p = u_particles[i];
    vec4 info = u_particleData[i];

    vec2 d = uv - p.xy;

    float angle = p.w;
    float c = cos(angle);
    float sA = sin(angle);

    mat2 rot = mat2(
      c, -sA,
      sA, c
    );

    d = rot * d;

    // ovale Fischform
    d.x *= 0.65;
    d.y *= 1.65;

    float r2 = dot(d, d);
    float s = p.z;
    float s2 = s * s;

    // harte/matte Körpermaske statt reiner Glow-Wolke
    float body = smoothstep(1.0, 0.0, r2 / (s2 * 1.00));

    // heller Kern, aber nicht riesig
    float core = smoothstep(0.45, 0.0, r2 / (s2 * 0.22));

    // sehr subtiler äußerer Glow
    float glow = smoothstep(1.0, 0.0, r2 / (s2 * 5.0));

    // Grundlicht
    float light = 0.10;

    // Klicklicht
    for (int g = 0; g < 8; g++) {
      if (g >= u_glowCount) break;

      vec4 cg = u_glows[g];

      float gd = distance(uv, cg.xy);

      if (gd < cg.z) {
        float tapLight = 1.0 - smoothstep(0.0, cg.z, gd);
        light = max(light, 0.25 + tapLight * 0.75 * cg.w);
      }
    }

    // p.w kommt aus JS: life * brightness
    float intensity = clamp(info.x * light, 0.0, 1.0);
    vec3 bodyColor = vec3(0.32, 0.68, 0.86);   // matter blau-grauer Body
    vec3 coreColor = vec3(0.70, 0.95, 1.00);   // heller Kern
    vec3 glowColor = vec3(0.05, 0.55, 0.85);   // dezenter Cyan-Glow

    float bodyA = body * 0.92 * intensity;
    float coreA = core * 0.35 * intensity;
    float glowA = glow * 0.10 * intensity;

    col += bodyColor * bodyA;
    col += coreColor * coreA;
    col += glowColor * glowA;

    outAlpha += bodyA;
    outAlpha += coreA;
    outAlpha += glowA;
  }

  gl_FragColor = vec4(col, clamp(outAlpha, 0.0, 1.0));
}
`;