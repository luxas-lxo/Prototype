// Full-screen vertex shader
const fishVert = `
precision mediump float;

attribute vec3 aPosition;

void main() {
  vec4 positionVec4 = vec4(aPosition, 1.0);
  positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
  gl_Position = positionVec4;
}
`;

// Fish particle fragment shader
const fishFrag = `
precision mediump float;

uniform vec2 u_resolution;
uniform int u_count;

// x, y, size, angle
uniform vec4 u_particles[80];

// red, green, blue, intensity
uniform vec4 u_particleData[80];

void main() {
  vec2 uv = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);

  vec3 colorOutput = vec3(0.0);
  float alphaOutput = 0.0;

  for (int i = 0; i < 80; i++) {
    if (i >= u_count) break;

    vec4 particle = u_particles[i];
    vec4 particleInfo = u_particleData[i];

    vec2 offset = uv - particle.xy;

    float particleAngle = particle.w;
    float angleCos = cos(particleAngle);
    float angleSin = sin(particleAngle);

    mat2 rotation = mat2(angleCos, -angleSin, angleSin, angleCos);

    offset = rotation * offset;

    // Transform the circular distance field into an oval fish shape
    offset.x *= 0.65;
    offset.y *= 1.65;

    float particleSize = max(particle.z, 0.001);
    float particleSizeSquared = particleSize * particleSize;
    float radiusSquared = dot(offset, offset);
    float normalizedRadiusSquared = radiusSquared / particleSizeSquared;

    // Create a smooth but clearly defined fish body
    float body = smoothstep(1.0, 0.82, normalizedRadiusSquared);

    // Convert the pixel position into normalized local fish coordinates
    vec2 localPosition = offset / particleSize;

    // Approximate the curved surface of an ellipsoid
    float surfaceDepth = sqrt(max(0.0, 1.0 - dot(localPosition, localPosition)));

    // Create a fixed diagonal highlight without simulating a real light source
    float diagonalGradient = clamp(0.5 - localPosition.x * 0.42 - localPosition.y * 0.58, 0.0, 1.0);

    // Combine the directional gradient with the curved body volume
    float shading = clamp(diagonalGradient * 0.88 + surfaceDepth * 0.12, 0.0, 1.0);
    shading = smoothstep(0.05, 0.95, shading);

    vec3 baseColor = particleInfo.rgb;
    float intensity = clamp(particleInfo.a, 0.0, 1.0);

    // Derive the shadow and highlight colors from the individual base color
    vec3 shadowColor = baseColor * 0.28;

    // Blend from a strongly darkened shadow to an almost white highlight
    vec3 midColor = baseColor;
    vec3 highlightColor = baseColor * 1.35;
    vec3 shadedColor;

    if (shading < 0.5) {
        shadedColor = mix(shadowColor, midColor, shading * 2.0);
    } else {
        shadedColor = mix(midColor, highlightColor, (shading - 0.5) * 2.0);
    }

    // Keep the edges slightly darker to strengthen the rounded appearance
    float edgeDarkening = mix(0.68, 1.0, surfaceDepth);
    shadedColor *= edgeDarkening;

    float bodyAlpha = body * intensity;

    colorOutput += shadedColor * bodyAlpha;
    alphaOutput += bodyAlpha;
  }

  gl_FragColor = vec4(colorOutput, clamp(alphaOutput, 0.0, 1.0));
}
`;