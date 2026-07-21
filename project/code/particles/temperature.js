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
   * @param {Object} data Annual water temperatures indexed by year.
   * @param {Object} options Optional visualization overrides.
   */
  constructor(
    data = {},
    options = {}
  ) {
    // Store annual raw temperature values.
    this.data = data;

    const validTemperatures =
      Object.values(this.data)
        .map(Number)
        .filter(Number.isFinite);

    // Determine the normalization range from the complete dataset.
    this.minTemperature =
      validTemperatures.length > 0
        ? min(validTemperatures)
        : 0;

    this.maxTemperature =
      validTemperatures.length > 0
        ? max(validTemperatures)
        : 1;

    if (
      this.maxTemperature ===
      this.minTemperature
    ) {
      this.maxTemperature =
        this.minTemperature + 1;
    }

    // Store the currently applied real temperature value.
    this.currentTemperatureC =
      this.data[
        CONFIG.temperature.data
          .startYear
      ] ??
      this.minTemperature;

    // Configure the initial normalized temperature value.
    this.temperature = constrain(
      options.temperature ??
        CONFIG.temperature.initialState
          .temperature,
      0,
      1
    );

    // Store the normalized value the surface transitions toward.
    this.targetTemperature =
      this.temperature;

    // Configure the overall visibility of the temperature layer.
    this.opacity = constrain(
      options.opacity ??
        CONFIG.temperature.initialState
          .opacity,
      0,
      1
    );

    // Configure the shader animation speed.
    this.speed = max(
      0,
      options.speed ??
        CONFIG.temperature.initialState
          .speed
    );

    // Convert the configured hexadecimal colors into normalized shader RGB.
    this.coldColor =
      this.colorToShaderRGB(
        CONFIG.temperature.colors.cold
      );

    this.neutralColor =
      this.colorToShaderRGB(
        CONFIG.temperature.colors.neutral
      );

    this.warmColor =
      this.colorToShaderRGB(
        CONFIG.temperature.colors.warm
      );

    // Create the off-screen WEBGL layer used to run the temperature shader.
    this.layer = createGraphics(
      width,
      height,
      WEBGL
    );

    this.layer.pixelDensity(
      CONFIG.temperature.rendering
        .pixelDensity
    );

    // Compile the temperature shader for the off-screen layer.
    this.shader =
      this.layer.createShader(
        waterTemperatureVert,
        waterTemperatureFrag
      );

    // Apply the first available dataset year.
    this.setYear(
      CONFIG.temperature.data
        .startYear
    );

    // Start directly at the first target value.
    this.temperature =
      this.targetTemperature;
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
   * Updates the normalized target water-temperature value.
   *
   * @param {number} value New normalized temperature value.
   */
  setTemperature(value) {
    this.targetTemperature =
      constrain(
        value,
        0,
        1
      );
  }

  /**
   * Applies the raw water temperature associated with a specific year.
   *
   * @param {number} year Dataset year to apply.
   */
  setYear(year) {
    const value =
      Number(
        this.data[year]
      );

    if (!Number.isFinite(value)) {
      return;
    }

    this.currentTemperatureC =
      value;

    this.setFromTemperature(
      value
    );
  }

  /**
   * Normalizes and visually scales a raw temperature value.
   *
   * @param {number} value Raw water temperature in degrees Celsius.
   */
  setFromTemperature(value) {
    const normalizedTemperature =
      constrain(
        map(
          value,
          this.minTemperature,
          this.maxTemperature,
          0,
          1
        ),
        0,
        1
      );

    const centeredTemperature =
      normalizedTemperature - 0.5;

    const visuallyScaledTemperature =
      0.5 +
      centeredTemperature *
      CONFIG.temperature.data
        .visualContrast;

    this.setTemperature(
      constrain(
        visuallyScaledTemperature,
        0,
        1
      )
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
   * Gradually moves the rendered temperature toward the yearly target value.
   */
  updateTemperature() {
    this.temperature = lerp(
      this.temperature,
      this.targetTemperature,
      CONFIG.temperature.transition
        .interpolationSpeed
    );

    if (
      abs(
        this.temperature -
        this.targetTemperature
      ) < 0.0001
    ) {
      this.temperature =
        this.targetTemperature;
    }
  }

  /**
   * Renders the animated temperature shader and draws its result to the
   * main canvas.
   */
  draw() {
    this.updateTemperature();
    
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