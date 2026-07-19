const planktonVert = `
precision mediump float;

attribute vec3 aPosition;

void main() {
  vec4 position = vec4(aPosition, 1.0);
  position.xy = position.xy * 2.0 - 1.0;
  gl_Position = position;
}
`;

const planktonFrag = `
precision mediump float;

uniform vec2 u_resolution;
uniform int u_count;

// x, y, size, unused
uniform vec4 u_particles[200];

// red, green, blue, visibility
uniform vec4 u_particleData[200];

// depth, unused, unused, unused
uniform vec4 u_particleStyle[200];

void main() {
  vec2 uv = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  vec3 colorOutput = vec3(0.0);
  float alphaOutput = 0.0;

  for (int i = 0; i < 200; i++) {
    if (i >= u_count) break;

    vec4 particle = u_particles[i];
    vec4 particleInfo = u_particleData[i];

    float particleSize = max(particle.z, 0.001);
    float radius = length(uv - particle.xy) / particleSize;

    vec3 baseColor = particleInfo.rgb;
    float visibility = clamp(particleInfo.a, 0.0, 1.0);
    float depth = u_particleStyle[i].x;

    // Soft translucent body
    float body = 1.0 - smoothstep(0.72, 1.0, radius);

    // Large soft glow fading outward
    float glow = 1.0 - smoothstep(0.92, 8.6, radius);

    float depthBrightness = mix(0.72, 1.0, depth);
    float colorStrength = body * 0.50 + glow * 0.20;
    float particleAlpha = clamp(body * 0.001 + glow * 0.01, 0.0, 1.0) * visibility;

    vec3 particleColor = baseColor * colorStrength * depthBrightness;

    colorOutput += particleColor * particleAlpha;
    alphaOutput += particleAlpha;
  }

  gl_FragColor = vec4(colorOutput, clamp(alphaOutput, 0.0, 1.0));
}
`;