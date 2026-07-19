let fishSwarms = [];
let clickForces = [];
let clickGlows = [];

let codTable;
let codSwarms = [];

let currentYear = 1970;
const FRAMES_PER_YEAR = 250;
let yearSpeed = 1 / FRAMES_PER_YEAR;
const FISH_FADE_IN_SPEED = 0.015;
const AGE_SPEED = 1 / (30 * FRAMES_PER_YEAR); 

let trailLayer;
let fishShader;
let shaderLayer;

let planktonShader;
let planktonShaderLayer;
let planktonGroup;

let coralLineLayer;
let coralGlowMaskLayer;
let coralGlowLayer;
let coralGlowShader;
let coralDLA;

let waterTemperatureSurface;

let pollutionField;
let pollutionParticles;


let stage = 0;
let aquarium;
let frameRateP;

const rand = 0.15;

// Maximum number of fish simulated and rendered per swarm
const SHADER_PARTICLE_LIMIT = 80;
const MAX_SHADER_PARTICLES = SHADER_PARTICLE_LIMIT;

// Available base colors assigned randomly to individual fish
const FISH_COLORS = [
    "#0042D6",
    "#0084D6",
    "#0400D6",
    "#00C7D6",
    "#4A00D6"
];

// Maximum number of plankton particles simulated and rendered
const MAX_PLANKTON_PARTICLES = 200;
const PLANKTON_COLORS = [
  "#00EE70", 
  "#25BA6B", 
  "#36875C", 
  "#325442", 
  "#e2e927"
];

// Available base colors assigned randomly to individual coral particles
const MAX_CORAL_SEGMENTS_PER_BATCH = 80;
const CORAL_COLORS = [
  "#5500ED", 
  "#0900ED", 
  "#A500ED", 
  "#0042ED", 
  "#ED00E4", 
  "#B66CFF"
];

const TEMPERATURE_COLORS = {
  cold: "#0B005F",
  neutral: "#00315E",
  warm: "#ae00de"
};

const TEMPERATURE_COLORS_ = {
  cold: "#20005f",
  neutral: "#5b005e",
  warm: "#de0051"
};

// Dimensions of the simulated 3D world
const WORLD = {
  w: 280 * 2,
  h: 220 * 2,
  d: 260 * 2
};
