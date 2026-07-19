function drawGlowBackground() {
  noStroke();

  for (let r = 700; r > 0; r -= 30) {
    let alpha = map(r, 700, 0, 0, 16);
    fill(0, 120, 160, alpha);
    ellipse(width / 2, height / 2, r, r);
  }
}

function drawInterface(year) {
  fill(180, 240, 255, 180);
  textSize(12);
  textAlign(LEFT, TOP);

  text("YEAR " + year, 24, 44);
  text("Gadus morhua / Atlantic cod", 24, 64);
}