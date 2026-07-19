const CONFIG = {
  fish: {
    // Defines the year range available in the fish biomass dataset
    data: {
      startYear: 1970,
      endYear: 2020
    },

    // Controls fish rendering and shader-related limits
    rendering: {
      // Maximum number of fish that can be passed to the shader
      maxShaderParticles: 80,

      // Available base colors assigned randomly to individual fish
      colors: [
        "#0042D6",
        "#0084D6",
        "#0400D6",
        "#00C7D6",
        "#4A00D6"
      ]
    },

    // Controls fish lifetime, fade-in behavior, and aging
    lifecycle: {
      // Interpolation speed used when fish fade into view
      fadeInSpeed: 0.015,

      // Amount added to the normalized fish age per frame
      ageSpeed: 1 / (30 * 250),

      // Initial visibility value assigned to newly created fish
      initialLife: 1.0,

      // Maximum normalized initial age assigned randomly to fish
      initialMaxAge: 1.0
    },

    // Controls the overall fish swarm
    swarm: {
      // Minimum number of active fish in a swarm
      minFish: 10,

      // Controls the size of the swarm
      radius: {
        // Minimum swarm radius at low biomass
        min: 90,

        // Maximum swarm radius at high biomass
        max: 300,

        // Interpolation speed used when changing the swarm radius
        interpolationSpeed: 0.04
      },

      // Initial movement settings for the swarm center
      initialMovement: {
        // Minimum initial swarm speed
        speedMin: 0.2,

        // Maximum initial swarm speed
        speedMax: 0.8,

        // Maximum random Perlin noise offset
        noiseOffsetMax: 10000
      },

      // Default dynamic properties assigned to a new swarm
      initialProperties: {
        brightness: 1.0,
        cohesion: 0.001,
        speedLimit: 1.5
      },

      // Movement settings for the swarm center
      movement: {
        // Controls how quickly the swarm noise changes over time
        noiseTimeSpeed: 0.006,

        // Strength of the noise force applied to the swarm center
        noiseForce: 0.08,

        // Noise offsets used to generate independent Y and Z movement
        noiseYOffset: 1000,
        noiseZOffset: 2000,

        // Base movement speed limit of the swarm center
        baseSpeedLimit: 1.0,

        // Additional swarm speed added for each stage
        stageSpeedIncrease: 0.15
      }
    },

    // Controls the behavior and appearance of individual fish
    individual: {
      // Initial movement settings for individual fish
      initialMovement: {
        // Minimum initial fish speed
        speedMin: 0.2,

        // Maximum initial fish speed
        speedMax: 1.0,

        // Maximum random Perlin noise offset
        noiseOffsetMax: 10000
      },

      // Random size range assigned to individual fish
      size: {
        min: 2,
        max: 6
      },

      // Maps normalized biomass values to visual and movement properties
      biomass: {
        // Fish brightness range
        brightness: {
          min: 0.25,
          max: 1.0
        },

        // Swarm cohesion range
        cohesion: {
          min: 0.0005,
          max: 0.002
        },

        // Individual fish speed limit range
        speedLimit: {
          min: 0.7,
          max: 2.0
        }
      },

      // Movement settings for individual fish
      movement: {
        // Centering force applied when a fish is outside the swarm radius
        outsideCenterForceMultiplier: 4.0,

        // Centering force applied when a fish is inside the swarm radius
        insideCenterForceMultiplier: 0.25,

        // Controls how quickly individual fish noise changes over time
        noiseTimeSpeed: 0.01,

        // Strength of the noise force applied to individual fish
        noiseForce: 0.08,

        // Noise offsets used to generate independent Y and Z movement
        noiseYOffset: 100,
        noiseZOffset: 200,

        // Amount of swarm-center velocity inherited by individual fish
        swarmVelocityInfluence: 0.025,

        // Additional fish speed added for each stage
        stageSpeedIncrease: 0.2
      },

      // Keeps individual fish within the swarm area
      boundary: {
        // Maximum distance from the center relative to the swarm radius
        radiusMultiplier: 1.25,

        // Velocity multiplier applied when a fish reaches the boundary
        bounceMultiplier: -0.25
      }
    },

    // Controls trail rendering behind individual fish
    trail: {
      // Base alpha value of fish trails
      alpha: 42,

      // Width of the rendered trail lines
      strokeWeight: 1,

      // Trail brightness range based on depth
      depthBrightness: {
        min: 0.55,
        max: 1.0
      },

      // Trail opacity range based on depth
      depthAlpha: {
        min: 0.65,
        max: 1.0
      },

      // Trail opacity range based on swarm brightness
      swarmBrightness: {
        min: 0.65,
        max: 1.0
      }
    },

    // Controls interactions between fish and user input
    interaction: {
      // Multiplier applied to click-based repulsion forces
      clickForceMultiplier: 0.08
    },

    // Controls the boundaries used by the swarm center
    worldBoundary: {
      // Distance maintained between the swarm center and world edges
      margin: 20
    }
  },

  plankton: {
    // Controls particle count and shader-related limits
    rendering: {
      // Maximum number of plankton particles supported by the shader
      maxShaderParticles: 200,

      // Number of active plankton particles
      activeCount: 200,

      // Available base colors assigned randomly to plankton particles
      colors: [
        "#00EE70",
        "#25BA6B",
        "#36875C",
        "#325442",
        "#E2E927"
      ]
    },

    // Controls the initial distribution around the group center
    distribution: {
      // Fraction of each world dimension used as the default spread
      worldSpreadFactor: 0.35
    },

    // Controls the visual size of individual plankton particles
    size: {
      min: 0.1,
      max: 1.0
    },

    // Controls particle movement and Perlin-noise behavior
    movement: {
      // Minimum initial particle speed
      initialSpeedMin: 0.01,

      // Maximum particle speed
      maxSpeed: 0.16,

      // Strength of the noise force applied to each particle
      noiseStrength: 0.008,

      // Controls how quickly the noise field changes over time
      noiseTimeSpeed: 0.0025,

      // Offsets used to generate independent Y and Z noise values
      noiseYOffset: 1000,
      noiseZOffset: 2000,

      // Maximum random Perlin-noise offset assigned to each particle
      noiseOffsetMax: 10000
    },

    // Controls particle visibility over time
    lifecycle: {
      // Initial visibility assigned to new particles
      initialLife: 0.0,

      // Maximum normalized visibility
      maxLife: 1.0,

      // Amount added to visibility per frame
      fadeInSpeed: 0.012
    },

    // Controls the subtle size animation used while rendering
    pulse: {
      // Base scale before the pulse is applied
      baseScale: 1.0,

      // Controls how quickly the pulse animation changes
      timeSpeed: 0.018,

      // Maximum relative size variation caused by the pulse
      strength: 0.05
    },

    // Controls brightness based on three-dimensional depth
    depth: {
      brightness: {
        min: 0.55,
        max: 1.0
      }
    },

    // Controls particle collision with the world boundaries
    boundary: {
      // Distance maintained between particles and the world edges
      margin: 10
    },

    // Controls random values used by the plankton shader
    shaderStyle: {
      // Maximum random style seed assigned to each particle
      seedMax: 1000
    }
  },

  coral: {
    // Controls the number and growth rate of coral colonies
    growth: {
      // Number of independent coral colonies
      seedCount: 5,

      // Maximum number of nodes across all colonies
      maxNodes: 4000,

      // Number of random walkers simulated per frame
      walkersPerFrame: 6,

      // Maximum number of movement steps performed by each walker
      stepsPerWalker: 200
    },

    // Controls the core diffusion-limited aggregation behavior
    dla: {
      // Distance moved by a walker during one simulation step
      stepSize: 2.2,

      // Distance between a new node and its parent node
      nodeSpacing: 3.2,

      // Maximum distance at which a walker may attach to a node
      stickDistance: 5.0,

      // Distance outside the colony radius where walkers are created
      spawnDistance: 45,

      // Additional distance walkers may travel before being removed
      killDistance: 180,

      // Minimum allowed distance relative to node spacing
      minimumNodeDistanceFactor: 0.7
    },

    // Controls walker direction and movement behavior
    walker: {
      // Force that attracts walkers toward the colony seed
      inwardBias: 0.6,

      // Amount of the previous direction retained each step
      directionPersistence: 0.55,

      // Strength of random directional movement
      randomStrength: 0.32,

      // Initial blend between random and inward movement
      initialInwardBlend: 0.35,

      // Small threshold used when testing vector lengths
      minimumDirectionMagnitudeSquared: 0.000001
    },

    // Controls how walkers interact with the canvas boundaries
    boundary: {
      // Distance between the coral growth area and the canvas edge
      margin: 0,

      // Distance from the edge at which steering begins
      steeringRange: 80,

      // Strength of the steering force near canvas boundaries
      steeringStrength: 0.2,

      // Number of canvas sides available for colony seeds
      sideCount: 4
    },

    // Controls the artificial depth assigned to coral nodes
    depth: {
      // Allowed normalized depth range
      min: 0.0,
      max: 1.0,

      // Initial depth range assigned to colony seed nodes
      initialMin: 0.35,
      initialMax: 0.65,

      // Maximum depth change between connected nodes
      variation: 0.055,

      // Scale used to sample depth noise
      noiseScale: 0.08,

      // Multiplier applied to centered depth noise
      variationMultiplier: 2.0
    },

    // Controls coral branch thickness
    width: {
      // Minimum rendered branch width
      min: 0.7,

      // Maximum rendered branch width
      max: 5.5,

      // Exponential width reduction applied per generation
      generationDecay: 0.018,

      // Width multiplier applied to distant nodes
      depthScale: 0.55
    },

    // Controls the visual growth animation
    animation: {
      // Number of frames required for a node to become fully visible
      fadeDuration: 60,

      // Whether branch length grows together with node visibility
      animateSegmentLength: true
    },

    // Controls coral colors
    rendering: {
      // Available base colors assigned randomly to coral colonies
      colors: [
        "#5500ED",
        "#0900ED",
        "#A500ED",
        "#0042ED",
        "#ED00E4",
        "#B66CFF"
      ],

      // Debug-render brightness range based on depth
      depthBrightness: {
        near: 1.0,
        far: 0.42
      },

      // Debug-render alpha range based on depth
      depthAlpha: {
        near: 220,
        far: 85
      }
    },

    // Controls the spatial grid used for nearby-node searches
    spatialGrid: {
      // Multiplier used to derive cell size from the stick distance
      cellSizeMultiplier: 2.0,

      // Number of neighboring cells searched in each direction
      searchRadius: 1
    }
  },

  temperature: {
    // Controls the initial state of the temperature visualization
    initialState: {
      // Normalized temperature value between 0 and 1
      temperature: 0.5,

      // Overall opacity of the temperature layer
      opacity: 0.25,

      // Animation speed multiplier
      speed: 0.5
    },

    // Controls the colors used for cold, neutral, and warm water
    colors: {
      cold: "#0B005F",
      neutral: "#00315E",
      warm: "#AE00DE"
    },

    colors_: {
      cold: "#20005F",
      neutral: "#5B005E",
      warm: "#DE0051"
    },

    // Controls the off-screen WEBGL rendering layer
    rendering: {
      // Pixel density used by the temperature graphics layer
      pixelDensity: 1,

      // Converts milliseconds to seconds for the shader time uniform
      millisecondsToSeconds: 0.001
    }
  },

  pollution: {
    // Controls the CPU-rendered pollution patches and particles
    field: {
        // Initial normalized pollution level
        pollution: 0.45,

        // Maximum numbers of visible elements at full pollution
        maxPatches: 32,
        maxParticles: 800,

        // Overall opacity of patches and individual particles
        opacity: {
        patch: 0.5,
        particle: 0.9
        },

        // Controls the random radius of pollution patches
        patchRadius: {
            min: 30,
            max: 95
        },

        // Controls the irregular polygon shape of each patch
        patchShape: {
            vertexCount: {
                min: 5,
                maxExclusive: 9
            },

            radiusFactor: {
                min: 0.55,
                max: 1.0
            }
        },

        // Controls patch movement
        patchMovement: {
            velocityX: {
                min: 0.18,
                max: 0.45
            },

            velocityY: {
                min: -0.08,
                max: 0.08
            },

            driftSpeed: 0.2,
            rotationSpeed: 0.0004,

            noiseTimeSpeed: 0.002,

            verticalFlow: {
                min: -0.08,
                max: 0.08
            },

            wrapRadiusMultiplier: 1.5
        },

        // Controls randomly generated patch properties
        patchProperties: {
            intensity: {
                min: 0.45,
                max: 1.0
            },

            noiseOffsetMax: 1000
        },

        // Controls the small CPU-rendered pollution particles
        particle: {
            // Distance from a patch where new particles may be created
            patchSpawnRadiusMultiplier: 1.4,

            velocityX: {
                min: 0.12,
                max: 0.5
            },

            velocityY: {
                min: -0.1,
                max: 0.1
            },

            size: {
                min: 0.5,
                max: 4.5
            },

            length: {
                min: 2,
                max: 8
            },

            rotationSpeed: {
                min: -0.004,
                max: 0.004
            },

            opacity: {
                min: 0.3,
                max: 1.0
            },

            // Rectangle, triangle, or line
            shapeCount: 3,

            noiseOffsetMax: 1000,

            flow: {
                noiseTimeSpeed: 0.004,
                angleMultiplier: 0.35,
                movementStrength: 0.04
            },

            wrapMargin: 10,

            line: {
                minimumStrokeWeight: 0.5,
                strokeWeightFactor: 0.35
            }
        },

        // Colors used by the CPU-rendered pollution field
        colors: {
            patch: "#676767",
            particle: "#8A8A8A"
        },

        // Controls the off-screen graphics layers
        rendering: {
            pixelDensity: 1,
            colorChannelMax: 255
        }
    },

    // Controls the shader-rendered pollution particles
    shaderParticles: {
        // Initial normalized pollution level
        pollution: 0.65,

        // Maximum number of active particles
        maxParticles: 256,

        // Fixed GLSL uniform-array capacity
        shaderCapacity: 256,

        // Overall shader opacity
        opacity: 0.55,

        // Base movement multiplier
        driftSpeed: 0.3,

        // Base particle color
        color: "#858585",

        // Controls ordinary and open-fragment particle generation
        shape: {
        openFragmentProbability: 0.01,

        regularLength: {
            min: 6,
            max: 17
        },

        openLength: {
            min: 10,
            max: 24
        },

        regularWidth: {
            min: 5,
            max: 13
        },

        openWidth: {
            min: 7,
            max: 18
        },

        regularOpacity: {
            min: 0.45,
            max: 1.0
        },

        openOpacity: {
            min: 0.35,
            max: 0.75
        },

        regularType: 0,
        openType: 1
        },

        // Controls the initial particle velocity
        initialMovement: {
        velocityX: {
            min: 0.15,
            max: 0.55
        },

        velocityY: {
            min: -0.12,
            max: 0.12
        },

        rotationSpeed: {
            min: -0.0025,
            max: 0.0025
        }
        },

        // Controls the animated noise-based particle drift
        movement: {
        noiseTimeSpeed: 0.004,

        flowAngle: {
            min: -0.35,
            max: 0.35
        },

        flowStrength: 0.035,

        wrapMargin: 20
        },

        // Controls random values passed to the shader
        random: {
        seedMax: 10000,
        noiseOffsetMax: 1000
        },

        // Controls the off-screen WEBGL layer
        rendering: {
        pixelDensity: 1
        }
    }
  }
};