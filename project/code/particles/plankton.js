/**
 * Simulates a group of three-dimensional plankton particles.
 *
 * The class creates a fixed particle pool and updates only the configured
 * number of active particles. Particle data is projected into screen space
 * and passed to a full-screen shader for rendering.
 */
class PlanktonGroup3D {
  /**
   * Creates a plankton group around a world-space center position.
   *
   * @param {number} cx Initial world-space x-coordinate.
   * @param {number} cy Initial world-space y-coordinate.
   * @param {number} cz Initial world-space z-coordinate.
   * @param {Object} data Normalized plankton abundance values indexed by year.
   * @param {Object} options Optional per-group configuration overrides.
   */
  constructor(
    cx,
    cy,
    cz,
    data = {},
    options = {}
  ) {
    this.pos = createVector(
      cx,
      cy,
      cz
    );

    // Store yearly plankton abundance values.
    this.data = data;

    // Keep the particle pool compatible with the fixed GLSL array capacity.
    const shaderParticleLimit =
      CONFIG.plankton.rendering
        .maxShaderParticles;

    this.maxParticles = constrain(
      floor(
        options.maxParticles ??
          shaderParticleLimit
      ),
      1,
      shaderParticleLimit
    );

    // Define the minimum visible population for the lowest data value.
    this.minParticles = constrain(
      floor(
        options.minParticles ??
          CONFIG.plankton.population
            .minParticles
      ),
      0,
      this.maxParticles
    );

    // Define the highest visible population controlled by abundance data.
    this.populationMax = constrain(
      floor(
        options.maxVisibleParticles ??
          CONFIG.plankton.population
            .maxParticles
      ),
      this.minParticles,
      this.maxParticles
    );

    // Define the initial target population before yearly data is applied.
    this.targetCount = constrain(
      floor(
        options.count ??
          CONFIG.plankton.rendering
            .activeCount
      ),
      this.minParticles,
      this.populationMax
    );

    // Define the three-dimensional area used for the initial distribution.
    this.spreadX =
      options.spreadX ??
      WORLD.w *
        CONFIG.plankton.distribution
          .worldSpreadFactor;

    this.spreadY =
      options.spreadY ??
      WORLD.h *
        CONFIG.plankton.distribution
          .worldSpreadFactor;

    this.spreadZ =
      options.spreadZ ??
      WORLD.d *
        CONFIG.plankton.distribution
          .worldSpreadFactor;

    // Define particle appearance and movement settings.
    this.minSize =
      options.minSize ??
      CONFIG.plankton.size.min;

    this.maxSize = max(
      options.maxSize ??
        CONFIG.plankton.size.max,
      this.minSize
    );

    this.maxSpeed = max(
      options.maxSpeed ??
        CONFIG.plankton.movement.maxSpeed,
      0
    );

    this.noiseStrength = max(
      options.noiseStrength ??
        CONFIG.plankton.movement
          .noiseStrength,
      0
    );

    this.fadeInSpeed = max(
      options.fadeInSpeed ??
        CONFIG.plankton.lifecycle
          .fadeInSpeed,
      0
    );

    this.fadeOutSpeed = max(
      options.fadeOutSpeed ??
        CONFIG.plankton.lifecycle
          .fadeOutSpeed,
      0
    );

    // Store per-particle simulation and shader data in parallel arrays.
    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.colors = [];
    this.life = [];
    this.targetLife = [];
    this.noiseOffsets = [];
    this.phases = [];
    this.seeds = [];

    // Create a randomized activation order so particles fade in and out
    // across the full spatial distribution instead of following array order.
    this.activationOrder =
      shuffle(
        Array.from(
          {
            length:
              this.maxParticles
          },
          (_, index) =>
            index
        )
      );

    // Create the complete particle pool once.
    for (
      let i = 0;
      i < this.maxParticles;
      i++
    ) {
      this.positions.push(
        createVector(
          this.pos.x +
            random(
              -this.spreadX,
              this.spreadX
            ),

          this.pos.y +
            random(
              -this.spreadY,
              this.spreadY
            ),

          this.pos.z +
            random(
              -this.spreadZ,
              this.spreadZ
            )
        )
      );

      this.velocities.push(
        p5.Vector.random3D().mult(
          random(
            CONFIG.plankton.movement
              .initialSpeedMin,
            this.maxSpeed
          )
        )
      );

      this.sizes.push(
        random(
          this.minSize,
          this.maxSize
        )
      );

      this.colors.push(
        color(
          random(
            CONFIG.plankton.rendering
              .colors
          )
        )
      );

      const initialVisibility =
        CONFIG.plankton.lifecycle
          .initialLife;

      this.life.push(
        initialVisibility
      );

      this.targetLife.push(0);

      this.life.push(
        initialVisibility
      );

      this.targetLife.push(
        initialVisibility > 0
          ? 1
          : 0
      );

      this.noiseOffsets.push(
        random(
          CONFIG.plankton.movement
            .noiseOffsetMax
        )
      );

      this.phases.push(
        random(TWO_PI)
      );

      this.seeds.push(
        random(
          CONFIG.plankton.shaderStyle
            .seedMax
        )
      );
    }

    // Synchronize target visibility with the initial particle count.
    this.updateTargetVisibility();
  }

  /**
   * Applies the normalized plankton abundance associated with a specific year.
   *
   * @param {number} year Dataset year to apply.
   */
  setYear(year) {
    const abundance =
      Number(this.data[year]);

    if (!Number.isFinite(abundance)) {
      return;
    }

    this.setFromAbundance(
      abundance
    );
  }

  /**
   * Maps normalized Calanus abundance to the visible particle population.
   *
   * @param {number} abundance Normalized abundance value between zero and one.
   */
  setFromAbundance(abundance) {
    const normalizedAbundance =
      constrain(
        abundance,
        0,
        1
      );

    this.targetCount = floor(
      lerp(
        this.minParticles,
        this.populationMax,
        normalizedAbundance
      )
    );

    this.updateTargetVisibility();
  }

  /**
   * Assigns target visibility according to the current target population.
   */
  updateTargetVisibility() {
    for (
      let orderIndex = 0;
      orderIndex < this.maxParticles;
      orderIndex++
    ) {
      const particleIndex =
        this.activationOrder[
          orderIndex
        ];

      this.targetLife[
        particleIndex
      ] =
        orderIndex <
        this.targetCount
          ? CONFIG.plankton.lifecycle
              .maxLife
          : 0;
    }
  }

  /**
   * Gradually moves every particle toward its target visibility.
   */
  updateVisibility() {
    for (
      let i = 0;
      i < this.maxParticles;
      i++
    ) {
      const isFadingIn =
        this.targetLife[i] >
        this.life[i];

      const fadeSpeed =
        isFadingIn
          ? this.fadeInSpeed
          : this.fadeOutSpeed;

      this.life[i] = lerp(
        this.life[i],
        this.targetLife[i],
        fadeSpeed
      );

      if (
        abs(
          this.life[i] -
          this.targetLife[i]
        ) < 0.001
      ) {
        this.life[i] =
          this.targetLife[i];
      }
    }
  }

  /**
   * Advances the complete plankton particle pool by one simulation frame.
   *
   * All particles remain in the simulation so they can fade in and out without
   * suddenly appearing or disappearing.
   */
  update() {
    this.updateVisibility();

    const visibilityThreshold =
      CONFIG.plankton.population
        .visibilityThreshold;

    for (
      let i = 0;
      i < this.maxParticles;
      i++
    ) {
      if (
        this.life[i] >
          visibilityThreshold ||
        this.targetLife[i] > 0
      ) {
        this.updateParticle(i);
      }
    }
  }

  /**
   * Updates the movement and visibility of one plankton particle.
   *
   * Perlin noise creates independent three-dimensional drift. The particle
   * velocity is limited before the new position is applied.
   *
   * @param {number} index Index of the particle in the particle pool.
   */
  updateParticle(index) {
    const position =
      this.positions[index];

    const velocity =
      this.velocities[index];

    const noiseOffset =
      this.noiseOffsets[index];

    const noiseTime =
      frameCount *
      CONFIG.plankton.movement.noiseTimeSpeed;

    const noiseForce = createVector(
      noise(
        noiseOffset +
          noiseTime
      ) - 0.5,

      noise(
        noiseOffset +
          CONFIG.plankton.movement.noiseYOffset +
          noiseTime
      ) - 0.5,

      noise(
        noiseOffset +
          CONFIG.plankton.movement.noiseZOffset +
          noiseTime
      ) - 0.5
    ).mult(this.noiseStrength);

    velocity.add(noiseForce);
    velocity.limit(this.maxSpeed);
    position.add(velocity);

    this.keepParticleInside(index);
  }

  /**
   * Keeps one particle inside the configured three-dimensional world.
   *
   * The particle velocity is reflected when a boundary is crossed, and the
   * position is clamped to prevent it from remaining outside the world.
   *
   * @param {number} index Index of the particle in the particle pool.
   */
  keepParticleInside(index) {
    const position =
      this.positions[index];

    const velocity =
      this.velocities[index];

    const margin =
      CONFIG.plankton.boundary.margin;

    const minX =
      -WORLD.w / 2 + margin;

    const maxX =
      WORLD.w / 2 - margin;

    const minY =
      -WORLD.h / 2 + margin;

    const maxY =
      WORLD.h / 2 - margin;

    const minZ =
      -WORLD.d / 2 + margin;

    const maxZ =
      WORLD.d / 2 - margin;

    if (
      position.x < minX ||
      position.x > maxX
    ) {
      velocity.x *= -1;

      position.x = constrain(
        position.x,
        minX,
        maxX
      );
    }

    if (
      position.y < minY ||
      position.y > maxY
    ) {
      velocity.y *= -1;

      position.y = constrain(
        position.y,
        minY,
        maxY
      );
    }

    if (
      position.z < minZ ||
      position.z > maxZ
    ) {
      velocity.z *= -1;

      position.z = constrain(
        position.z,
        minZ,
        maxZ
      );
    }
  }

  /**
   * Packs active plankton data into fixed-size shader uniform arrays and
   * renders the group to a WEBGL graphics layer.
   *
   * @param {p5.Graphics} pg WEBGL graphics layer used for rendering.
   * @param {p5.Shader} shaderProgram Compiled plankton shader.
   */
  drawShader(pg, shaderProgram) {
    const particleData = [];
    const particleInfo = [];
    const particleStyle = [];

    const shaderParticleLimit =
      CONFIG.plankton.rendering.maxShaderParticles;

    const renderCount = min(
      this.maxParticles,
      shaderParticleLimit
    );

    for (
      let i = 0;
      i < shaderParticleLimit;
      i++
    ) {
      if (i < renderCount) {
        const position3D =
          this.positions[i];

        const position2D = calc_xy(
          position3D.x,
          position3D.y,
          position3D.z
        );

        const scale = calc_scaling(
          position3D.x,
          position3D.y,
          position3D.z
        );

        const pulse =
          CONFIG.plankton.pulse.baseScale +
          sin(
            frameCount *
              CONFIG.plankton.pulse.timeSpeed +
              this.phases[i]
          ) *
            CONFIG.plankton.pulse.strength;

        const particleColor =
          this.colors[i];

        const depth =
          this.getNormalizedDepth(
            position3D.z
          );

        const depthBrightness = lerp(
          CONFIG.plankton.depth.brightness.min,
          CONFIG.plankton.depth.brightness.max,
          depth
        );

        particleData.push(
          position2D.x,
          position2D.y,
          this.sizes[i] *
            scale *
            pulse,
          0
        );

        particleInfo.push(
          red(particleColor) /
            255 *
            depthBrightness,

          green(particleColor) /
            255 *
            depthBrightness,

          blue(particleColor) /
            255 *
            depthBrightness,

          this.life[i]
        );

        particleStyle.push(
          this.seeds[i],
          this.phases[i],
          depth,
          0
        );
      } else {
        particleData.push(
          0,
          0,
          0,
          0
        );

        particleInfo.push(
          0,
          0,
          0,
          0
        );

        particleStyle.push(
          0,
          0,
          0,
          0
        );
      }
    }

    pg.shader(shaderProgram);

    shaderProgram.setUniform(
      "u_resolution",
      [width, height]
    );

    shaderProgram.setUniform(
      "u_count",
      renderCount
    );

    shaderProgram.setUniform(
      "u_particles",
      particleData
    );

    shaderProgram.setUniform(
      "u_particleData",
      particleInfo
    );

    shaderProgram.setUniform(
      "u_particleStyle",
      particleStyle
    );

    pg.noStroke();
    pg.rect(0, 0, width, height);
  }

  /**
   * Converts a world-space z-coordinate into normalized depth.
   *
   * @param {number} z World-space z-coordinate.
   * @returns {number} Depth value in the range 0 to 1.
   */
  getNormalizedDepth(z) {
    return constrain(
      map(
        z,
        -WORLD.d / 2,
        WORLD.d / 2,
        0,
        1
      ),
      0,
      1
    );
  }
}