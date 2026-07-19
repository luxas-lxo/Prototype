const coralGlowVert = `
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

const coralGlowFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_radius;
uniform float u_strength;

varying vec2 vTexCoord;

void main() {
  vec2 texel = 1.0 / u_resolution;
  vec2 horizontalOffset = vec2(texel.x * u_radius, 0.0);
  vec2 verticalOffset = vec2(0.0, texel.y * u_radius);
  vec2 diagonalOffsetA = horizontalOffset + verticalOffset;
  vec2 diagonalOffsetB = horizontalOffset - verticalOffset;

  vec4 center = texture2D(u_texture, vTexCoord) * 0.20;

  vec4 blur = center;
  blur += texture2D(u_texture, vTexCoord + horizontalOffset) * 0.10;
  blur += texture2D(u_texture, vTexCoord - horizontalOffset) * 0.10;
  blur += texture2D(u_texture, vTexCoord + verticalOffset) * 0.10;
  blur += texture2D(u_texture, vTexCoord - verticalOffset) * 0.10;
  blur += texture2D(u_texture, vTexCoord + diagonalOffsetA) * 0.075;
  blur += texture2D(u_texture, vTexCoord - diagonalOffsetA) * 0.075;
  blur += texture2D(u_texture, vTexCoord + diagonalOffsetB) * 0.075;
  blur += texture2D(u_texture, vTexCoord - diagonalOffsetB) * 0.075;

  gl_FragColor = vec4(blur.rgb * u_strength, blur.a * u_strength);
}
`;