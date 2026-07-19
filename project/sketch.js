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

  planktonShader = createShader(planktonVert, planktonFrag);
  planktonShaderLayer = createGraphics(width, height, WEBGL);
  planktonShaderLayer.pixelDensity(1);
  planktonShaderLayer.clear();

  planktonGroup = new PlanktonGroup3D(0, 0, 0, {
    count: 200,
    maxParticles: MAX_PLANKTON_PARTICLES,
    minSize: 0.1,
    maxSize: 1.0,
    maxSpeed: 0.16,
    noiseStrength: 0.008
  });

  coralLineLayer = createGraphics(width, height);
  coralGlowMaskLayer = createGraphics(width, height);
  coralGlowLayer = createGraphics(width, height, WEBGL);

  coralLineLayer.pixelDensity(1);
  coralGlowMaskLayer.pixelDensity(1);
  coralGlowLayer.pixelDensity(1);

  coralGlowShader = createShader(coralGlowVert, coralGlowFrag);

  coralDLA = new CoralDLA2D({
    seedCount: 5,
    maxNodes: 4000,
    walkersPerFrame: 6,
    stepsPerWalker: 200,
    stepSize: 2.2,
    nodeSpacing: 3.2,
    stickDistance: 5.0,
    spawnDistance: 45,
    killDistance: 180,
    inwardBias: 0.6,
    directionPersistence: 0.55,
    randomStrength: 0.32,
    fadeDuration: 60,
    animateSegmentLength: true,
    minWidth: 0.7,
    maxWidth: 5.5,
    generationWidthDecay: 0.018,
    depthVariation: 0.055
  });

  waterTemperatureSurface = new WaterTemperatureSurface({
    temperature: 0.5,
    opacity: 0.5,
    speed: 0.5
  });

  pollutionField = new PollutionField({
    pollution: 0.45,

    maxPatches: 32,
    maxParticles: 800,

    minPatchRadius: 30,
    maxPatchRadius: 95,

    patchOpacity: 0.5,
    particleOpacity: 0.9,

    driftSpeed: 0.2,
    rotationSpeed: 0.0004,

    patchColor: "#676767",
    particleColor: "#8A8A8A"
  });

  pollutionParticles =
    new PollutionParticleField({
      pollution: 0.65,
      maxParticles: 1000,
      opacity: 0.55,
      driftSpeed: 0.3,
      color: "#858585"
    });
}

function draw() {
  frameRateP.html(round(frameRate()));
  background(3, 8, 14);

  waterTemperatureSurface.draw();

  planktonShaderLayer.clear();
  planktonShaderLayer.blendMode(BLEND);

  planktonGroup.update();
  planktonGroup.drawShader(planktonShaderLayer, planktonShader);

  image(planktonShaderLayer, 0, 0);

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

  //coralDLA.update();

  if (!coralDLA.finished) {
    //drawCoralLines(coralDLA);
    //drawCoralGlow();
  }

  //image(coralGlowLayer, 0, 0);
  //image(coralLineLayer, 0, 0);

  //pollutionField.draw();
  pollutionParticles.draw();
  

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