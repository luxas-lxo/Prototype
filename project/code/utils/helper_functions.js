// -----------------------------------------------------------------------------
// FISH
// -----------------------------------------------------------------------------

/**
 * Loads external project data before the sketch starts.
 */
function preload() {
  codTable = loadTable(
    "data/fish2.csv",
    "csv",
    "header"
  );
}

/**
 * Initializes the fish shader, fish layers, aquarium, and biomass swarms.
 */
function initializeFishSystem() {
  fishShader = createShader(
    fishVert,
    fishFrag
  );

  shaderLayer =
    createRenderLayer(true);

  trailLayer =
    createRenderLayer(false);

  aquarium =
    new Statue();

  createCodSwarms();
}

/**
 * Creates fish swarms from the loaded cod biomass table.
 */
function createCodSwarms() {
  codSwarms = [];

  const maximumSwarmCount = 20;

  const swarmCount = min(
    codTable.getRowCount(),
    maximumSwarmCount
  );

  for (
    let i = 0;
    i < swarmCount;
    i++
  ) {
    const record =
      codTable.getRow(i).obj;

    const x = random(
      -WORLD.w * 0.35,
      WORLD.w * 0.35
    );

    const y = random(
      -WORLD.h * 0.25,
      WORLD.h * 0.25
    );

    const z = random(
      -WORLD.d * 0.2,
      WORLD.d * 0.2
    );

    codSwarms.push(
      new FishSwarm3(
        record,
        x,
        y,
        z,
        {
          minFish: 5,
          maxFish:
            CONFIG.fish.rendering
              .maxShaderParticles,

          minRadius: 90,
          maxRadius: 260,

          maxParticles:
            CONFIG.fish.rendering
              .maxShaderParticles
        }
      )
    );
  }
}

/**
 * Draws the accumulated fish trail layer.
 */
function drawFishTrails() {
  image(
    trailLayer,
    0,
    0
  );
}

/**
 * Advances the active data year and renders all fish swarms.
 */
function drawFishSystem() {
  const year =
    updateCurrentYear();

  shaderLayer.clear();
  shaderLayer.blendMode(BLEND);

  for (
    const swarm of
    codSwarms
  ) {
    swarm.setYear(year);
    swarm.update();

    swarm.drawShader(
      shaderLayer,
      fishShader
    );
  }

  image(
    shaderLayer,
    0,
    0
  );
}

/**
 * Advances the current dataset year without exceeding the available range.
 *
 * @returns {number} Current integer dataset year.
 */
function updateCurrentYear() {
  currentYear +=
    yearSpeed;

  currentYear = min(
    currentYear,
    CONFIG.fish.data.endYear
  );

  return floor(
    currentYear
  );
}

/**
 * Creates one legacy FishSwarm instance.
 *
 * @param {number} count Number of fish.
 * @param {number} cx Swarm-center x-coordinate.
 * @param {number} cy Swarm-center y-coordinate.
 * @param {number} cz Swarm-center z-coordinate.
 * @param {number} rad Swarm radius.
 */
function generate_swarm(
  count,
  cx = 0,
  cy = 0,
  cz = 0,
  rad = 90
) {
  fishSwarms.push(
    new FishSwarm(
      count,
      cx,
      cy,
      cz,
      rad
    )
  );
}

/**
 * Advances the development stage and recreates legacy fish swarms after the
 * final stage.
 *
 * This function is currently not called.
 */
function advanceStage() {
  stage++;

  if (stage <= 5) {
    return;
  }

  stage = 0;
  fishSwarms = [];

  generate_swarm(
    40,
    random(
      -WORLD.w / 3,
      WORLD.w / 3
    ),
    random(
      -WORLD.h / 3,
      WORLD.h / 3
    ),
    random(
      -WORLD.d / 3,
      WORLD.d / 3
    ),
    90
  );

  generate_swarm(
    35,
    random(
      -WORLD.w / 3,
      WORLD.w / 3
    ),
    random(
      -WORLD.h / 3,
      WORLD.h / 3
    ),
    random(
      -WORLD.d / 3,
      WORLD.d / 3
    ),
    80
  );

  generate_swarm(
    25,
    random(
      -WORLD.w / 3,
      WORLD.w / 3
    ),
    random(
      -WORLD.h / 3,
      WORLD.h / 3
    ),
    random(
      -WORLD.d / 3,
      WORLD.d / 3
    ),
    70
  );
}


// -----------------------------------------------------------------------------
// PLANKTON
// -----------------------------------------------------------------------------

/**
 * Initializes the plankton shader, rendering layer, and particle group.
 */
function initializePlanktonSystem() {
  planktonShader = createShader(
    planktonVert,
    planktonFrag
  );

  planktonShaderLayer =
    createRenderLayer(true);

  planktonGroup =
    new PlanktonGroup3D(
      0,
      0,
      0
    );
}

/**
 * Updates and renders the plankton particle system.
 */
function drawPlanktonSystem() {
  planktonShaderLayer.clear();
  planktonShaderLayer.blendMode(BLEND);

  planktonGroup.update();

  planktonGroup.drawShader(
    planktonShaderLayer,
    planktonShader
  );

  image(
    planktonShaderLayer,
    0,
    0
  );
}


// -----------------------------------------------------------------------------
// CORAL
// -----------------------------------------------------------------------------

/**
 * Initializes coral rendering layers, shader, and growth simulation.
 */
function initializeCoralSystem() {
  coralLineLayer =
    createRenderLayer(false);

  coralGlowMaskLayer =
    createRenderLayer(false);

  coralGlowLayer =
    createRenderLayer(true);

  coralGlowShader = createShader(
    coralGlowVert,
    coralGlowFrag
  );

  coralDLA =
    new CoralDLA2D();
}

/**
 * Updates the coral growth while it is active and always renders the
 * existing coral structure.
 */
function drawCoralSystem_() {
  // Stop generating new nodes after the coral reaches its limit.
  if (!coralDLA.finished) {
    coralDLA.update();
    drawCoralLines(coralDLA);
    drawCoralGlow();
  }

  // Always composite the existing coral layers onto the main canvas.
  image(
    coralGlowLayer,
    0,
    0
  );

  image(
    coralLineLayer,
    0,
    0
  );
}

function drawCoralSystem() {
  if (!coralDLA.finished) {
    coralDLA.update();
  }

  drawCoralLines(coralDLA);
  drawCoralGlow();

  // Draw the diffuse watercolor wash first.
  image(
    coralGlowLayer,
    0,
    0
  );

  // Draw the more defined coral branches above the wash.
  image(
    coralLineLayer,
    0,
    0
  );
}

/**
 * Renders all coral segments into the visible line layer and the glow mask.
 *
 * @param {CoralDLA2D} coral Coral simulation to render.
 */
function drawCoralLines_(coral) {
  const segments =
    coral.getSegments();

  coralLineLayer.clear();
  coralGlowMaskLayer.clear();

  coralLineLayer.strokeCap(ROUND);
  coralLineLayer.strokeJoin(ROUND);

  coralGlowMaskLayer.strokeCap(ROUND);
  coralGlowMaskLayer.strokeJoin(ROUND);

  for (const segment of segments) {
    const segmentColor =
      segment.color;

    const visibility =
      segment.visibility;

    const depthBrightness =
      lerp(
        1,
        0.45,
        segment.depth
      );

    const depthAlpha =
      lerp(
        1,
        0.4,
        segment.depth
      );

    const redValue =
      red(segmentColor) *
      depthBrightness;

    const greenValue =
      green(segmentColor) *
      depthBrightness;

    const blueValue =
      blue(segmentColor) *
      depthBrightness;

    // Draw a wide colored line that acts as the glow source.
    coralGlowMaskLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      90 *
        visibility *
        depthAlpha *
        0.5
    );

    coralGlowMaskLayer.strokeWeight(
      segment.width *
      4.5
    );

    coralGlowMaskLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );

    // Draw a bright outer line around the coral branch.
    coralLineLayer.stroke(
      255,
      255,
      255,
      75 *
        visibility *
        depthAlpha *
        0.5
    );

    coralLineLayer.strokeWeight(
      segment.width *
      2.3
    );

    coralLineLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );

    // Draw the colored inner coral branch.
    coralLineLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      220 *
        visibility *
        depthAlpha *
        0.5
    );

    coralLineLayer.strokeWeight(
      segment.width
    );

    coralLineLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );
  }
}

/**
 * Renders coral branches as soft layered pigment strokes.
 *
 * The result avoids a neon appearance by using lower alpha values,
 * less saturated colors, and no bright white outline.
 *
 * @param {CoralDLA2D} coral Coral simulation to render.
 */
function drawCoralLines(coral) {
  const segments =
    coral.getSegments();

  coralLineLayer.clear();
  coralGlowMaskLayer.clear();

  coralLineLayer.strokeCap(ROUND);
  coralLineLayer.strokeJoin(ROUND);

  coralGlowMaskLayer.strokeCap(ROUND);
  coralGlowMaskLayer.strokeJoin(ROUND);

  for (const segment of segments) {
    const segmentColor =
      segment.color;

    const visibility =
      segment.visibility;

    const depthBrightness =
      lerp(
        0.92,
        0.62,
        segment.depth
      );

    const depthAlpha =
      lerp(
        0.95,
        0.45,
        segment.depth
      );

    let redValue =
      red(segmentColor) *
      depthBrightness;

    let greenValue =
      green(segmentColor) *
      depthBrightness;

    let blueValue =
      blue(segmentColor) *
      depthBrightness;

    // Desaturate slightly so the coral feels more like pigment than neon light.
    const luminance =
      redValue * 0.299 +
      greenValue * 0.587 +
      blueValue * 0.114;

    redValue = lerp(
      luminance,
      redValue,
      0.72
    );

    greenValue = lerp(
      luminance,
      greenValue,
      0.72
    );

    blueValue = lerp(
      luminance,
      blueValue,
      0.72
    );

    const visibleAlpha =
      visibility *
      depthAlpha;

    // Broad, faint wash for the watercolor bleed texture.
    coralGlowMaskLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      22 * visibleAlpha
    );

    coralGlowMaskLayer.strokeWeight(
      segment.width * 5.2
    );

    coralGlowMaskLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );

    // Soft outer pigment body.
    coralLineLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      24 * visibleAlpha
    );

    coralLineLayer.strokeWeight(
      segment.width * 2.6
    );

    coralLineLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );

    // Main visible branch stroke.
    coralLineLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      68 * visibleAlpha
    );

    coralLineLayer.strokeWeight(
      segment.width * 1.35
    );

    coralLineLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );

    // Very subtle inner definition.
    coralLineLayer.stroke(
      redValue,
      greenValue,
      blueValue,
      0.5 * visibleAlpha
    );

    coralLineLayer.strokeWeight(
      max(
        0.45,
        segment.width * 0.52
      )
    );

    coralLineLayer.line(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    );
  }
}

/**
 * Applies the coral glow shader to the current glow mask.
 */
function drawCoralGlow_() {
  coralGlowLayer.clear();

  coralGlowLayer.shader(
    coralGlowShader
  );

  coralGlowShader.setUniform(
    "u_texture",
    coralGlowMaskLayer
  );

  coralGlowShader.setUniform(
    "u_resolution",
    [
      width,
      height
    ]
  );

  coralGlowShader.setUniform(
    "u_radius",
    5
  );

  coralGlowShader.setUniform(
    "u_strength",
    0.75
  );

  coralGlowLayer.noStroke();

  coralGlowLayer.rect(
    -width / 2,
    -height / 2,
    width,
    height
  );

  coralGlowLayer.resetShader();
}

/**
 * Applies a subtle watercolor bleed effect to the coral pigment mask.
 */
function drawCoralGlow() {
  coralGlowLayer.clear();

  coralGlowLayer.shader(
    coralGlowShader
  );

  coralGlowShader.setUniform(
    "u_texture",
    coralGlowMaskLayer
  );

  coralGlowShader.setUniform(
    "u_resolution",
    [width, height]
  );

  coralGlowShader.setUniform(
    "u_time",
    millis() * 0.001
  );

  // Smaller spread to reduce the glowing halo.
  coralGlowShader.setUniform(
    "u_radius",
    2.2
  );

  // Lower overall intensity.
  coralGlowShader.setUniform(
    "u_strength",
    0.45
  );

  // Very subtle grain.
  coralGlowShader.setUniform(
    "u_grainStrength",
    0.012
  );

  // Mild edge irregularity.
  coralGlowShader.setUniform(
    "u_edgeVariation",
    0.9
  );

  coralGlowLayer.noStroke();

  coralGlowLayer.rect(
    -width / 2,
    -height / 2,
    width,
    height
  );

  coralGlowLayer.resetShader();
}

// -----------------------------------------------------------------------------
// TEMPERATURE AND POLLUTION
// -----------------------------------------------------------------------------

/**
 * Initializes temperature and pollution visual systems.
 */
function initializeEnvironmentSystems() {
  waterTemperatureSurface = new WaterTemperatureSurface();

  pollutionField =new PollutionField();

  pollutionParticles =new PollutionParticleField();

  sceneLayer = createGraphics(
    width,
    height
  );

  pollutionCompositeLayer =
    createGraphics(
      width,
      height,
      WEBGL
    );

  pollutionPostProcessShader =
    pollutionCompositeLayer.createShader(
      pollutionPostVert,
      pollutionPostFrag
    );
}

/**
 * Draws the base background and animated temperature surface.
 */
function drawBackgroundLayers() {
  background(
    3,
    8,
    14
  );

  waterTemperatureSurface.draw();
}

/**
 * Renders the selected pollution visualization.
 *
 * The CPU-rendered field is currently disabled while the shader particle
 * system remains active.
 */
function drawPollutionSystem() {
  pollutionField.draw();

  // pollutionParticles.draw();
}

/*
* Applies a post-processing shader to the current canvas content that
* desaturates the scene based on the pollution mask.
*/
function applyPollutionPostProcess() {
  if (
    !pollutionPostProcessShader ||
    !pollutionCompositeLayer ||
    !sceneLayer ||
    !pollutionField
  ) {
    return;
  }

  // Capture the complete scene that is currently visible on the main canvas.
  sceneLayer.clear();

  sceneLayer.image(
    get(),
    0,
    0,
    width,
    height
  );

  pollutionCompositeLayer.clear();

  pollutionCompositeLayer.shader(
    pollutionPostProcessShader
  );

  pollutionPostProcessShader.setUniform(
    "u_scene",
    sceneLayer
  );

  pollutionPostProcessShader.setUniform(
    "u_pollutionMask",
    pollutionField.getMaskLayer()
  );

  pollutionPostProcessShader.setUniform(
    "u_strength",
    CONFIG.pollution.postProcess
      .desaturationStrength
  );

  pollutionCompositeLayer.noStroke();

  pollutionCompositeLayer.rect(
    -width / 2,
    -height / 2,
    width,
    height
  );

  // Replace the visible canvas with the processed scene.
  image(
    pollutionCompositeLayer,
    0,
    0,
    width,
    height
  );
}

// -----------------------------------------------------------------------------
// AQUARIUM
// -----------------------------------------------------------------------------

/**
 * Draws aquarium background effects and the aquarium structure.
 */
function drawAquariumSystem() {
  drawGlowBackground();
  aquarium.draw();
}


// -----------------------------------------------------------------------------
// CLICK INTERACTION
// -----------------------------------------------------------------------------

/**
 * Creates all visual and physical effects associated with a click.
 *
 * @param {number} x Horizontal click position.
 * @param {number} y Vertical click position.
 */
function createClickEffect(x, y) {
  clickGlows.push(
    new ClickGlow(x, y)
  );

  clickForces.push(
    new ClickForce(x, y)
  );
}

/**
 * Updates and removes expired click glow and repulsion effects.
 */
function updateClickEffects() {
  updateClickGlows();
  updateClickForces();
}

/**
 * Draws active click glows and removes expired instances.
 */
function updateClickGlows() {
  for (
    let i =
      clickGlows.length - 1;
    i >= 0;
    i--
  ) {
    const glow =
      clickGlows[i];

    glow.draw();
    glow.update();

    if (glow.dead()) {
      clickGlows.splice(
        i,
        1
      );
    }
  }
}

/**
 * Updates click repulsion forces and removes expired instances.
 */
function updateClickForces() {
  for (
    let i =
      clickForces.length - 1;
    i >= 0;
    i--
  ) {
    const force =
      clickForces[i];

    force.update();

    if (force.dead()) {
      clickForces.splice(
        i,
        1
      );
    }
  }
}


// -----------------------------------------------------------------------------
// PROJECTION CALCULATIONS
// -----------------------------------------------------------------------------

/**
 * Projects a three-dimensional world position into two-dimensional
 * screen coordinates.
 *
 * @param {number} x World-space x-coordinate.
 * @param {number} y World-space y-coordinate.
 * @param {number} z World-space z-coordinate.
 * @returns {Object} Projected screen-space x and y coordinates.
 */
function calc_xy(x, y, z) {
  const scale =
    calc_scaling(
      x,
      y,
      z
    );

  return {
    x:
      width / 2 +
      x * scale,

    y:
      height / 2 +
      y * scale
  };
}

/**
 * Calculates the perspective scale for a three-dimensional world position.
 *
 * The x and y arguments are retained for compatibility with existing calls,
 * although only the z-coordinate affects the current projection.
 *
 * @param {number} x World-space x-coordinate.
 * @param {number} y World-space y-coordinate.
 * @param {number} z World-space z-coordinate.
 * @returns {number} Perspective scale factor.
 */
function calc_scaling(x, y, z) {
  const projectionDepth =
    WORLD.d * 1.2;

  return (
    projectionDepth /
    (
      projectionDepth +
      z
    )
  );
}


// -----------------------------------------------------------------------------
// CANVAS AND RENDERING
// -----------------------------------------------------------------------------

/**
 * Creates the main canvas and configures its pixel density.
 */
function initializeCanvas() {
  createCanvas(
    windowWidth,
    windowHeight
  );

  pixelDensity(1);
}

/**
 * Initializes the dimensions of the simulated three-dimensional world.
 */
function initializeWorld() {
  WORLD.w =
    width * 0.6;

  WORLD.h =
    height * 0.6;

  WORLD.d =
    max(width, height) * 0.6;
}

/**
 * Creates a graphics layer with the selected renderer.
 *
 * @param {boolean} useWebGL Whether the layer should use WEBGL.
 * @returns {p5.Graphics} Configured graphics layer.
 */
function createRenderLayer(useWebGL = false) {
  const layer = useWebGL
    ? createGraphics(
        width,
        height,
        WEBGL
      )
    : createGraphics(
        width,
        height
      );

  layer.pixelDensity(1);
  layer.clear();

  return layer;
}

/**
 * Resizes the main canvas, updates world dimensions, and resizes all
 * initialized off-screen graphics layers.
 */
function windowResized() {
  resizeCanvas(
    windowWidth,
    windowHeight
  );

  initializeWorld();
  resizeRenderLayers();
}

/**
 * Resizes every initialized off-screen graphics layer.
 */
function resizeRenderLayers() {
  resizeGraphicsLayer(
    shaderLayer
  );

  resizeGraphicsLayer(
    trailLayer
  );

  resizeGraphicsLayer(
    planktonShaderLayer
  );

  resizeGraphicsLayer(
    coralLineLayer
  );

  resizeGraphicsLayer(
    coralGlowMaskLayer
  );

  resizeGraphicsLayer(
    coralGlowLayer
  );

  waterTemperatureSurface?.resize(
    width,
    height
  );

  pollutionField?.resize(
    width,
    height
  );

  pollutionParticles?.resize(
    width,
    height
  );
}

/**
 * Resizes a graphics layer when it has already been initialized.
 *
 * @param {p5.Graphics|undefined} layer Graphics layer to resize.
 */
function resizeGraphicsLayer(layer) {
  if (!layer) {
    return;
  }

  layer.resizeCanvas(
    width,
    height
  );
}


// -----------------------------------------------------------------------------
// INTERFACE AND DEBUGGING
// -----------------------------------------------------------------------------

/**
 * Creates interface elements used for debugging and monitoring.
 */
function initializeInterface() {
  frameRateP = createP();
}

/**
 * Updates the displayed frame-rate value.
 */
function updateFrameRateDisplay() {
  frameRateP.html(
    round(frameRate())
  );
}