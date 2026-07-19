class WaterTemperatureSurface {
  constructor(options = {}) {
    this.temperature = options.temperature ?? 0.5;
    this.opacity = options.opacity ?? 1.0;
    this.speed = options.speed ?? 1.0;

    this.coldColor = [red(TEMPERATURE_COLORS.cold) / 255, green(TEMPERATURE_COLORS.cold) / 255, blue(TEMPERATURE_COLORS.cold) / 255]; ;
    this.neutralColor = [red(TEMPERATURE_COLORS.neutral) / 255, green(TEMPERATURE_COLORS.neutral) / 255, blue(TEMPERATURE_COLORS.neutral) / 255];
    this.warmColor = [red(TEMPERATURE_COLORS.warm) / 255, green(TEMPERATURE_COLORS.warm) / 255, blue(TEMPERATURE_COLORS.warm) / 255];

    this.layer = createGraphics(width, height, WEBGL);
    this.layer.pixelDensity(1);
    this.shader = this.layer.createShader(waterTemperatureVert, waterTemperatureFrag);
  }

  setTemperature(value) {
    this.temperature = constrain(value, 0, 1);
  }

  setOpacity(value) {
    this.opacity = constrain(value, 0, 1);
  }

  resize(layerWidth, layerHeight) {
    this.layer.resizeCanvas(layerWidth, layerHeight);
  }

  draw() {
    this.layer.push();
    this.layer.clear();
    this.layer.blendMode(BLEND);
    this.layer.shader(this.shader);

    this.shader.setUniform("u_resolution", [this.layer.width, this.layer.height]);
    this.shader.setUniform("u_time", millis() * 0.001 * this.speed);
    this.shader.setUniform("u_temperature", this.temperature);
    this.shader.setUniform("u_opacity", this.opacity);
    this.shader.setUniform("u_coldColor", this.coldColor);
    this.shader.setUniform("u_neutralColor", this.neutralColor);
    this.shader.setUniform("u_warmColor", this.warmColor);

    this.layer.noStroke();
    this.layer.rect(
        -this.layer.width * 0.5,
        -this.layer.height * 0.5,
        this.layer.width,
        this.layer.height
    );

    this.layer.resetShader();
    this.layer.pop();

    push();
    blendMode(BLEND);
    noTint();
    image(this.layer, 0, 0, width, height);
    pop();
    }
}