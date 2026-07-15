function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

  frameRateP = createP();

  initWorld();

  fishShader = createShader(fishVert, fishFrag);

  shaderLayer = createGraphics(width, height, WEBGL);
  shaderLayer.pixelDensity(1);
  shaderLayer.clear();

  aquarium = new Statue();

  for (let i = 0; i < min(codTable.getRowCount(), 20); i++) {
    let row = codTable.getRow(i).obj;

    let x = random(-WORLD.w * 0.35, WORLD.w * 0.35);
    let y = random(-WORLD.h * 0.25, WORLD.h * 0.25);
    let z = random(-WORLD.d * 0.2, WORLD.d * 0.2);

    codSwarms.push(
      new FishSwarm3(row, x, y, z, {
        minFish: 5,
        maxFish: 190,
        minRadius: 90,
        maxRadius: 260,
        maxParticles: MAX_SHADER_PARTICLES
      })
    );
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
  if (year > 2020) year = 2020;

  shaderLayer.clear();
  shaderLayer.blendMode(BLEND);

  for (let i = 0; i < codSwarms.length; i++) {
    codSwarms[i].setYear(year);
    codSwarms[i].update();
    codSwarms[i].drawShader(shaderLayer, fishShader);
    if (i === 0) {
      console.log("Fish in swarm: " + codSwarms[i].targetCount + "(" + year + ")");
    }
  }

  image(shaderLayer, 0, 0);

  for (let i = clickGlows.length - 1; i >= 0; i--) {
    clickGlows[i].draw();
    clickGlows[i].update();

    if (clickGlows[i].dead()) {
      clickGlows.splice(i, 1);
    }
  }

  for (let i = clickForces.length - 1; i >= 0; i--) {
    clickForces[i].update();

    if (clickForces[i].dead()) {
      clickForces.splice(i, 1);
    }
  }

  drawInterface(year);
}

function mousePressed() {
  clickGlows.push(new ClickGlow(mouseX, mouseY));
  clickForces.push(new ClickForce(mouseX, mouseY));
  
  //stage++;

  if (stage > 5) {
    stage = 0;
    fishSwarms = [];

    generate_swarm(40, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 90);
    generate_swarm(35, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 80);
    generate_swarm(25, random(-WORLD.w / 3, WORLD.w / 3), random(-WORLD.h / 3, WORLD.h / 3), random(-WORLD.d / 3, WORLD.d / 3), 70);
  }
}