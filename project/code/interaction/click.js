class ClickGlow {
  constructor(
    x,
    y,
    options = {}
  ) {
    this.pos =
      createVector(
        x,
        y
      );

    this.radius =
      options.radius ?? 5;

    this.maxRadius =
      options.maxRadius ?? 80;

    this.lightFactor =
      options.lightFactor ?? 0.45;

    this.alpha =
      options.alpha ??
      50 / 255;
  }

  update() {
    this.radius = lerp(
      this.radius,
      this.maxRadius,
      0.055
    );

    this.alpha *= 0.92;
  }

  dead() {
    return (
      this.alpha < 0.004 ||
      this.radius >
        this.maxRadius - 1
    );
  }

  getLightRadius() {
    return (
      this.radius *
      this.lightFactor
    );
  }
}

class ClickForce {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.radius = 180;
    this.strength = 8;
    this.life = 1;
  }

  update() {
    this.life *= 0.9;
  }

  dead() {
    return this.life < 0.02;
  }
}

