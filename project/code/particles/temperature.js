/**
 * Renders an animated full-screen water-temperature visualization.
 *
 * The class uses a dedicated WEBGL graphics layer and a fragment shader to
 * blend between cold, neutral, and warm colors. Temperature, opacity, and
 * animation speed can be changed independently.
 */
class WaterTemperatureSurface {
  /**
   * Creates the temperature surface and its off-screen WEBGL layer.
   *
   * @param {Object} options Optional visualization overrides.
   */
  constructor(options = {}) {
    // Configure the initial normalized temperature value.
    this.temperature = constrain(
      options.temperature ??
        CONFIG.temperature.initialState.temperature,
      0,
      1
    );

    // Configure the overall visibility of the temperature layer.
    this.opacity = constrain(
      options.opacity ??
        CONFIG.temperature.initialState.opacity,
      0,
      1
    );

    // Configure the shader animation speed.
    this.speed = max(
      0,
      options.speed ??
        CONFIG.temperature.initialState.speed
    );

    // Convert the configured hexadecimal colors into normalized shader RGB.
    this.coldColor = this.colorToShaderRGB(
      CONFIG.temperature.colors.cold
    );

    this.neutralColor = this.colorToShaderRGB(
      CONFIG.temperature.colors.neutral
    );

    this.warmColor = this.colorToShaderRGB(
      CONFIG.temperature.colors.warm
    );

    // Create the off-screen WEBGL layer used to run the temperature shader.
    this.layer = createGraphics(
      width,
      height,
      WEBGL
    );

    this.layer.pixelDensity(
      CONFIG.temperature.rendering.pixelDensity
    );

    // Compile the temperature shader for the off-screen layer.
    this.shader = this.layer.createShader(
      waterTemperatureVert,
      waterTemperatureFrag
    );
  }

  /**
   * Converts a p5-compatible color value into normalized shader RGB values.
   *
   * @param {string|p5.Color} value Color value to convert.
   * @returns {number[]} RGB components in the range 0 to 1.
   */
  colorToShaderRGB(value) {
    const convertedColor =
      color(value);

    return [
      red(convertedColor) / 255,
      green(convertedColor) / 255,
      blue(convertedColor) / 255
    ];
  }

  /**
   * Updates the normalized water-temperature value.
   *
   * A value of 0 represents the cold end of the color range, while a value
   * of 1 represents the warm end.
   *
   * @param {number} value New normalized temperature value.
   */
  setTemperature(value) {
    this.temperature = constrain(
      value,
      0,
      1
    );
  }

  /**
   * Updates the overall opacity of the temperature layer.
   *
   * @param {number} value New opacity value in the range 0 to 1.
   */
  setOpacity(value) {
    this.opacity = constrain(
      value,
      0,
      1
    );
  }

  /**
   * Updates the shader animation speed.
   *
   * Negative values are prevented because reversing time is not currently
   * required by the visualization.
   *
   * @param {number} value New non-negative speed multiplier.
   */
  setSpeed(value) {
    this.speed = max(
      0,
      value
    );
  }

  /**
   * Resizes the off-screen graphics layer.
   *
   * This method should be called when the main canvas size changes.
   *
   * @param {number} layerWidth New layer width in pixels.
   * @param {number} layerHeight New layer height in pixels.
   */
  resize(layerWidth, layerHeight) {
    this.layer.resizeCanvas(
      layerWidth,
      layerHeight
    );
  }

  /**
   * Renders the animated temperature shader and draws its result to the
   * main canvas.
   */
  draw() {
    this.layer.push();
    this.layer.clear();
    this.layer.blendMode(BLEND);
    this.layer.shader(this.shader);

    // Pass the current graphics-layer dimensions to the shader.
    this.shader.setUniform(
      "u_resolution",
      [
        this.layer.width,
        this.layer.height
      ]
    );

    // Convert elapsed milliseconds into animated shader time in seconds.
    this.shader.setUniform(
      "u_time",
      millis() *
        CONFIG.temperature.rendering
          .millisecondsToSeconds *
        this.speed
    );

    this.shader.setUniform(
      "u_temperature",
      this.temperature
    );

    this.shader.setUniform(
      "u_opacity",
      this.opacity
    );

    this.shader.setUniform(
      "u_coldColor",
      this.coldColor
    );

    this.shader.setUniform(
      "u_neutralColor",
      this.neutralColor
    );

    this.shader.setUniform(
      "u_warmColor",
      this.warmColor
    );

    // Draw a full-screen rectangle so the fragment shader runs for each pixel.
    this.layer.noStroke();

    this.layer.rect(
      -this.layer.width * 0.5,
      -this.layer.height * 0.5,
      this.layer.width,
      this.layer.height
    );

    this.layer.resetShader();
    this.layer.pop();

    // Composite the temperature layer onto the main canvas.
    push();
    blendMode(BLEND);
    noTint();

    image(
      this.layer,
      0,
      0,
      width,
      height
    );

    pop();
  }
}