const waterTemperatureVert = `
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

const waterTemperatureFrag = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_temperature;
uniform float u_opacity;

uniform vec3 u_coldColor;
uniform vec3 u_neutralColor;
uniform vec3 u_warmColor;

varying vec2 vTexCoord;

float hash(vec2 position) {
  return fract(sin(dot(position, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2D(vec2 position) {
  vec2 cell = floor(position);
  vec2 local = fract(position);

  local = local * local * (3.0 - 2.0 * local);

  float a = hash(cell);
  float b = hash(cell + vec2(1.0, 0.0));
  float c = hash(cell + vec2(0.0, 1.0));
  float d = hash(cell + vec2(1.0, 1.0));

  return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
}

float fbm(vec2 position) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 5; i++) {
    value += noise2D(position) * amplitude;
    position = position * 2.02 + vec2(13.7, 9.2);
    amplitude *= 0.5;
  }

  return value;
}

vec3 getTemperatureColor(float temperature) {
  temperature = clamp(temperature, 0.0, 1.0);

  if (temperature < 0.5) {
    return mix(u_coldColor, u_neutralColor, temperature * 2.0);
  }

  return mix(u_neutralColor, u_warmColor, (temperature - 0.5) * 2.0);
}

void main() {
  vec2 uv = vTexCoord;

  float aspect = u_resolution.x / u_resolution.y;
  vec2 position = uv - 0.5;
  position.x *= aspect;
  position *= vec2(0.65, 1.35);

  float time = u_time * 0.9;

    vec2 current = vec2(
    time * 0.16,
    sin(time * 0.35) * 0.08
    );

    vec2 warpA = vec2(
    fbm(position * 0.7 + current),
    fbm(position * 0.7 + vec2(8.0, 4.0) - current * 0.7)
    );

    vec2 warpB = vec2(
    fbm(position * 1.15 + warpA * 1.4 + current * 0.45),
    fbm(position * 1.15 + warpA * 1.4 - current * 0.35 + vec2(5.0, -2.0))
    );

    vec2 flowDirection = normalize(vec2(1.0, 0.24));

    vec2 warpedPosition = position;
    warpedPosition += flowDirection * (warpA.x - 0.5) * 0.55;
    warpedPosition += vec2(-flowDirection.y, flowDirection.x)
    * (warpA.y - 0.5) * 0.18;
    warpedPosition += (warpB - 0.5) * 0.1;

  float temperatureField = fbm(warpedPosition * 0.85 + vec2(time * 0.12, -time * 0.04));
  float secondaryField = fbm(warpedPosition * 1.8 + vec2(-time * 0.035, time * 0.06));
  float surfaceField = fbm(warpedPosition * 4.5 + vec2(time * 0.025, time * 0.02));

  temperatureField = mix(temperatureField, secondaryField, 0.24);
  temperatureField = mix(temperatureField, u_temperature, 0.32);

  float softField = smoothstep(0.18, 0.82, temperatureField);

  float localTemperature = clamp(
    u_temperature +
    (softField - 0.5) * 0.65 +
    (secondaryField - 0.5) * 0.18,
    0.0,
    1.0
  );

  vec3 temperatureColor = getTemperatureColor(localTemperature);

    float filmA = 1.0 - smoothstep(
        0.0,
        0.11,
        abs(softField - 0.44)
    );

    float filmB = 1.0 - smoothstep(
        0.0,
        0.08,
        abs(secondaryField - 0.57)
    );

    float filmC = 1.0 - smoothstep(
        0.0,
        0.065,
        abs(surfaceField - 0.52)
    );

    filmA = pow(filmA, 1.6);
    filmB = pow(filmB, 1.8);
    filmC = pow(filmC, 2.2);

    float temperatureA = clamp(
        u_temperature + (softField - 0.5) * 0.55,
        0.0,
        1.0
    );

    float temperatureB = clamp(
        u_temperature + (secondaryField - 0.5) * 0.75,
        0.0,
        1.0
    );

    float temperatureC = clamp(
        u_temperature + (surfaceField - 0.5) * 0.35,
        0.0,
        1.0
    );

    vec3 colorA = getTemperatureColor(temperatureA);
    vec3 colorB = getTemperatureColor(temperatureB);
    vec3 colorC = getTemperatureColor(temperatureC);

    float totalFilm = filmA * 0.95 + filmB * 0.74 + filmC * 0.51;

    vec3 finalColor = vec3(0.0);
    finalColor += colorA * filmA * 0.55;
    finalColor += colorB * filmB * 0.34;
    finalColor += colorC * filmC * 0.11;

    finalColor /= max(totalFilm, 0.0001);

    float alpha = totalFilm * 0.75;
    alpha *= clamp(u_opacity, 0.0, 1.0);

    gl_FragColor = vec4(finalColor * alpha, alpha);
}
`;