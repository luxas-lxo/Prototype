// -----------------------------------------------------------------------------
// START BUTTON
// -----------------------------------------------------------------------------

let startScreen;
let startButton;
let projectStarted = false;

// TIME AND DATA PROGRESSION
// -----------------------------------------------------------------------------

// Current year represented by the fish biomass visualization.
let currentYear = 1970;

// Number of animation frames used to represent one data year.
const FRAMES_PER_YEAR = 250;

// Amount by which the current year advances during each frame.
let yearSpeed =
  1 / FRAMES_PER_YEAR;

// Last integer year applied to the data-driven systems.
let lastAppliedYear = -1;

// Last integer dataset year applied to all visual systems.
let lastAppliedDatasetYear = -1;

// -----------------------------------------------------------------------------
// FISH
// -----------------------------------------------------------------------------

// Loaded fish biomass dataset.
let codTable;

// Active biomass-driven fish swarms.
let codSwarms = [];

// Legacy fish swarm collection.
// let fishSwarms = [];

// Layer used to preserve and display fish movement trails.
let trailLayer;

// Shader used to render the fish particles.
let fishShader;

// Off-screen WEBGL layer used by the fish shader.
let shaderLayer;


// -----------------------------------------------------------------------------
// PLANKTON
// -----------------------------------------------------------------------------

// Annual Calanus abundance dataset.
let planktonTable;

// Shader used to render the plankton particles.
let planktonShader;

// Off-screen WEBGL layer used by the plankton shader.
let planktonShaderLayer;

// Plankton particle simulation.
let planktonGroup;


// -----------------------------------------------------------------------------
// CORAL
// -----------------------------------------------------------------------------

// Layer containing the visible coral branch lines.
let coralLineLayer;

// Layer used as the source texture for the coral glow effect.
let coralGlowMaskLayer;

// Off-screen WEBGL layer containing the final coral glow.
let coralGlowLayer;

// Shader used to create the coral glow effect.
let coralGlowShader;

// Diffusion-limited coral growth simulation.
let coralDLA;


// -----------------------------------------------------------------------------
// WATER TEMPERATURE
// -----------------------------------------------------------------------------

// Annual water-temperature dataset.
let temperatureTable;

// Animated water-temperature visualization.
let waterTemperatureSurface;


// -----------------------------------------------------------------------------
// POLLUTION
// -----------------------------------------------------------------------------

// Annual marine plastic-stock dataset.
let pollutionTable;

// CPU-rendered pollution patches and debris particles.
let pollutionField;

// Shader-rendered pollution fragment particles.
let pollutionParticles;

// Full-screen shader used to apply pollution-based desaturation.
let pollutionPostProcessShader;

// WEBGL layer used to render the post-processed scene.
let pollutionCompositeLayer;

// Scene layer containing the complete normally rendered image.
let sceneLayer;

// -----------------------------------------------------------------------------
// FISHING
// -----------------------------------------------------------------------------

let fishingPressureTable;

// Fishing-pressure current field affecting fish movement.
let fishingPressureField;

// -----------------------------------------------------------------------------
// CLICK INTERACTION
// -----------------------------------------------------------------------------

// Temporary forces created when the canvas is clicked.
let clickForces = [];

// Temporary visual glow effects created when the canvas is clicked.
let clickGlows = [];


// -----------------------------------------------------------------------------
// AQUARIUM AND STAGE CONTROL
// -----------------------------------------------------------------------------

// Current presentation or development stage.
let stage = 0;

// Main aquarium or statue visualization.
let aquarium;

// -----------------------------------------------------------------------------
// INTERFACE AND DEBUGGING
// -----------------------------------------------------------------------------

// HTML element used to display the current frame rate.
let frameRateP;


// -----------------------------------------------------------------------------
// SIMULATED WORLD
// -----------------------------------------------------------------------------

// Dimensions of the simulated three-dimensional world.
const WORLD = {
  w: 280 * 2,
  h: 220 * 2,
  d: 260 * 2
};

// -----------------------------------------------------------------------------
// FRAME EXPORT
// -----------------------------------------------------------------------------

const FRAME_EXPORT = {
  enabled: false,

  // Frames per second of the final video.
  frameRate: 20,

  // Duration of the final video in seconds.
  durationSeconds: 2,

  // Name prefix used for exported PNG files.
  filePrefix: "ocean-art",

  // Frame at which the export was started.
  startFrame: 0,

  // Current exported frame index.
  currentFrame: 0,

  // Prevents multiple simultaneous exports.
  active: false
};

// -----------------------------------------------------------------------------
// CLICK EFFECTS
// -----------------------------------------------------------------------------

let clickGlowLayer;
let clickGlowShader;

let isDrawingClickGlow = false;
let lastClickGlowPoint = null;

const CLICK_GLOW_POINT_DISTANCE = 18;
const MAX_CLICK_GLOWS = 40;
const MAX_CLICK_FORCES = 40;