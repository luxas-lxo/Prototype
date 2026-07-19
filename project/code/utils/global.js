// -----------------------------------------------------------------------------
// TIME AND DATA PROGRESSION
// -----------------------------------------------------------------------------

// Current year represented by the fish biomass visualization.
let currentYear = 1970;

// Number of animation frames used to represent one data year.
const FRAMES_PER_YEAR = 250;

// Amount by which the current year advances during each frame.
let yearSpeed =
  1 / FRAMES_PER_YEAR;


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

// Animated water-temperature visualization.
let waterTemperatureSurface;


// -----------------------------------------------------------------------------
// POLLUTION
// -----------------------------------------------------------------------------

// CPU-rendered pollution patches and debris particles.
let pollutionField;

// Shader-rendered pollution fragment particles.
let pollutionParticles;


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
// SHARED VALUES
// -----------------------------------------------------------------------------

// Shared random or variation factor used by legacy visual systems.
// const rand = 0.15;


// -----------------------------------------------------------------------------
// SIMULATED WORLD
// -----------------------------------------------------------------------------

// Dimensions of the simulated three-dimensional world.
const WORLD = {
  w: 280 * 2,
  h: 220 * 2,
  d: 260 * 2
};
