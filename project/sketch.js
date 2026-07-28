/**
 * Initializes the canvas, rendering layers, shaders, simulations,
 * and visual systems.
 */
function setup() {
  initializeCanvas();
  initializeInterface();
  initializeWorld();
  initializeClickGlowSystem();

  initializeFishSystem();
  initializePlanktonSystem();
  initializeCoralSystem();
  initializeTemperatureSystem();
  initializeEnvironmentSystems();
  initializeFishingPressureSystem();
}


/**
 * Updates and renders one complete animation frame.
 */
function draw() {
  updateDatasetYear();
  updateFrameRateDisplay(datasetYear);
  drawBackgroundLayers();

  drawAquariumSystem();
  // drawCoralSystem();
  
  drawFishTrails();
  drawFishSystem();
  drawPlanktonSystem();

  pollutionField.update();
  pollutionField.renderMask();
  applyPollutionPostProcess();

  updateClickEffects();
  fishingPressureField.update();
  fishingPressureField.drawVisuals();
  //fishingPressureField.drawDebug();

  //drawPollutionSystem();

  exportCurrentFrame();
  drawCurrentData(currentYear);
}

/**
 * Starts a continuous click-glow stroke.
 */
function mousePressed() {
  isDrawingClickGlow = true;

  lastClickGlowPoint =
    createVector(
      mouseX,
      mouseY
    );

  createClickEffect(
    mouseX,
    mouseY
  );
}

/**
 * Adds glow points while the pointer is dragged.
 */
function mouseDragged() {
  if (
    !isDrawingClickGlow ||
    !lastClickGlowPoint
  ) {
    return;
  }

  if (
    mouseX < 0 ||
    mouseX > width ||
    mouseY < 0 ||
    mouseY > height
  ) {
    return;
  }

  const currentPoint =
    createVector(
      mouseX,
      mouseY
    );

  const distanceFromLastPoint =
    p5.Vector.dist(
      currentPoint,
      lastClickGlowPoint
    );

  if (
    distanceFromLastPoint <
    CLICK_GLOW_POINT_DISTANCE
  ) {
    return;
  }

  createGlowPointsBetween(
    lastClickGlowPoint,
    currentPoint
  );

  lastClickGlowPoint =
    currentPoint;
}

/**
 * Finishes the current click-glow stroke.
 */
function mouseReleased() {
  isDrawingClickGlow = false;
  lastClickGlowPoint = null;
}

/**
 * Starts frame-sequence rendering when the user presses the E key.
 */
function keyPressed() {
  if (
    key === "e" ||
    key === "E"
  ) {
    startFrameExport();
  }
}
