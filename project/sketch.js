/**
 * Initializes the canvas, rendering layers, shaders, simulations,
 * and visual systems.
 */
function setup() {
  initializeCanvas();
  initializeInterface();
  initializeWorld();

  initializeFishSystem();
  initializePlanktonSystem();
  initializeCoralSystem();
  initializeEnvironmentSystems();
  fishingPressureField = new FishingPressureField();
}


/**
 * Updates and renders one complete animation frame.
 */
function draw() {
  updateFrameRateDisplay();
  drawBackgroundLayers();

  drawAquariumSystem();
  // drawCoralSystem();

  drawFishTrails();
  drawFishSystem();
  drawPlanktonSystem();

  // pollutionField.update();
  // pollutionField.renderMask();
  // applyPollutionPostProcess();

  updateClickEffects();
  fishingPressureField.update();
  fishingPressureField.drawDebug();

  //drawPollutionSystem();

}

/**
 * Creates a glow and repulsion force at the mouse position.
 */
function mousePressed() {
  createClickEffect(
    mouseX,
    mouseY
  );

  // advanceStage();
}
