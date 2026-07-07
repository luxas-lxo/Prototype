
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  frameRateP = createP();

  aquarium = new Statue();

  for (let i = 0; i < min(codTable.getRowCount(), 5); i++) {
    let row = codTable.getRow(i).obj;

    let x = random(-WORLD.w * 0.45, WORLD.w * 0.45);
    let y = random(-WORLD.h * 0.35, WORLD.h * 0.35);
    let z = random(-WORLD.d * 0.25, WORLD.d * 0.25);

    codSwarms.push(
      //new DataFishSwarmGPU(row, x, y, z, 60)
      new FishSwarm2(row, x, y, z)
    );

    initWorld();
  }

  trailLayer = createGraphics(width, height);
  trailLayer.clear();
}

function draw() {
  frameRateP.html(round(frameRate()));
  background(3, 8, 14);

  image(trailLayer, 0, 0);

  drawGlowBackground();

  aquarium.draw();

  currentYear += yearSpeed;

  let year = floor(currentYear);

  if (year > 2020) {
    year = 2020;
  }

  for (let swarm of codSwarms) {
    swarm.setYear(year);
    swarm.update();
    swarm.draw();
  }

  drawInterface(year);
}

function mousePressed() {
  clickGlows.push(new ClickGlow(mouseX, mouseY));
  clickForces.push(new ClickForce(mouseX, mouseY));
  
  stage++;

  if (stage > 5) {
    stage = 0;
    fishSwarms = [];

    generate_swarm(40, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 90);
    generate_swarm(35, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 80);
    generate_swarm(25, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 70);
  }
}