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
}


/**
 * Updates and renders one complete animation frame.
 */
function draw() {
  updateFrameRateDisplay();
  drawBackgroundLayers();

  drawAquariumSystem();

  drawFishTrails();
  drawPlanktonSystem();
  
  drawFishSystem();

  updateClickEffects();

  // drawCoralSystem();
  // drawPollutionSystem();
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
