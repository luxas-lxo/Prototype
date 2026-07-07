class ClickGlow {
  constructor(x, y) {
    this.pos = createVector(x, y);

    this.radius = 5;
    this.maxRadius = 240;
    this.lightFactor = 0.45;

    this.alpha = 120;
  }

  update() {
    this.radius += 4;
    this.alpha *= 0.94;
  }

  draw() {
    noStroke();

    for (let r = this.radius; r > 0; r -= 12) {
      let a = map(r, this.radius, 0, 0, this.alpha);
      fill(0, 120, 160, a);

      ellipse(this.pos.x, this.pos.y, r * 2, r * 2);
    }
  }

  dead() {
    return this.alpha < 1 || this.radius > this.maxRadius;
  }

  getLightRadius() {
    return this.radius * this.lightFactor;
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

