class Statue {
  constructor() {
    this.points = [];

    for (let i = 0; i < 140; i++) {
      let t = map(i, 0, 139, 0, TWO_PI * 2.5);

      let r = 180 + 25 * sin(t * 1.7);
      let x = (cos(t)) * r;
      let y = map(i, 0, 139, -WORLD.h / 2 - 50, WORLD.h / 2 - 50);
      let z = (sin(t)) * r;

      this.points.push(createVector(x, y, z));
    }
  }

  draw() {
    noFill();
    stroke(80, 220, 255, 70);
    strokeWeight(0.5);

    beginShape();
    for (let p of this.points) {
      let pos = calc_xy(p.x, p.y, p.z);
      vertex(pos.x, pos.y);
    }
    endShape();
  }
}
