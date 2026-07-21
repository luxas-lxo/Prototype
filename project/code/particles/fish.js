/**
 * Simulates a three-dimensional fish swarm whose population, size,
 * appearance, and movement are controlled by biomass data.
 *
 * The class creates a fixed pool of fish particles and dynamically changes
 * the number of active fish instead of repeatedly creating and deleting them.
 */
class FishSwarm3 {
  /**
   * Creates a fish swarm around a world-space center position.
   *
   * @param {Object} record Biomass values indexed by year.
   * @param {number} cx Initial world-space x-coordinate.
   * @param {number} cy Initial world-space y-coordinate.
   * @param {number} cz Initial world-space z-coordinate.
   * @param {Object} options Optional per-swarm configuration overrides.
   */
  constructor(record, cx, cy, cz, options = {}) {
    // Store the biomass dataset used to control the swarm.
    this.data = record;

    // Initialize the position and movement of the swarm center.
    this.pos = createVector(cx, cy, cz);

    this.vel = p5.Vector.random3D().mult(
      random(
        CONFIG.fish.swarm.initialMovement.speedMin,
        CONFIG.fish.swarm.initialMovement.speedMax
      )
    );

    this.acc = createVector();

    this.noiseOffset = random(
      CONFIG.fish.swarm.initialMovement.noiseOffsetMax
    );

    // Apply per-swarm overrides or use the global fish configuration.
    this.maxParticles =
      options.maxParticles ??
      CONFIG.fish.rendering.maxShaderParticles;

    this.minFish =
      options.minFish ??
      CONFIG.fish.swarm.minFish;

    this.maxFish =
      options.maxFish ??
      this.maxParticles;

    this.minRadius =
      options.minRadius ??
      CONFIG.fish.swarm.radius.min;

    this.maxRadius =
      options.maxRadius ??
      CONFIG.fish.swarm.radius.max;

    // Store simulation and rendering data for each individual fish.
    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.life = [];
    this.age = [];
    this.noiseOffsets = [];
    this.colors = [];
    this.lastTrailPositions = [];

    // Collect all valid biomass values to determine the normalization range.
    this.values = [];

    this.values = this.interpolateYearlyValues(
      record,
      CONFIG.fish.data.startYear,
      CONFIG.fish.data.endYear
    );

    // Determine normalization maximum.
    const validValues = this.values.filter(
      value => Number.isFinite(value) && value > 0
    );

    this.maxBiomass =
      validValues.length > 0
        ? max(validValues)
        : 1;
    
    // Initialize with the first available value.
    this.currentBiomass =
      this.values.find(
        value => Number.isFinite(value) && value > 0
      ) ?? this.maxBiomass;

    this.setFromBiomass(this.currentBiomass);

    // Initialize dynamic swarm properties.
    this.rad =
      this.maxRadius;

    this.targetRadius =
      this.rad;

    this.activeCount = 0;
    this.targetCount = 0;

    this.brightness =
      CONFIG.fish.swarm.initialProperties.brightness;

    this.cohesion =
      CONFIG.fish.swarm.initialProperties.cohesion;

    this.speedLimit =
      CONFIG.fish.swarm.initialProperties.speedLimit;

    // Create the complete fish particle pool once.
    for (
      let i = 0;
      i < this.maxParticles;
      i++
    ) {
      this.positions.push(
        createVector(
          this.pos.x +
            random(
              -this.rad,
              this.rad
            ),

          this.pos.y +
            random(
              -this.rad * 0.5,
              this.rad * 0.5
            ),

          this.pos.z +
            random(
              -this.rad,
              this.rad
            )
        )
      );

      this.velocities.push(
        p5.Vector.random3D().mult(
          random(
            CONFIG.fish.individual.initialMovement.speedMin,
            CONFIG.fish.individual.initialMovement.speedMax
          )
        )
      );

      this.sizes.push(
        random(
          CONFIG.fish.individual.size.min,
          CONFIG.fish.individual.size.max
        )
      );

      this.life.push(
        CONFIG.fish.lifecycle.initialLife
      );

      this.age.push(
        random(
          CONFIG.fish.lifecycle.initialMaxAge
        )
      );

      this.noiseOffsets.push(
        random(
          CONFIG.fish.individual.initialMovement.noiseOffsetMax
        )
      );

      this.colors.push(
        color(
          random(
            CONFIG.fish.rendering.colors
          )
        )
      );

      this.lastTrailPositions.push(null);
    }

    // Apply the initial biomass state to the swarm.
    this.setFromBiomass(
      this.currentBiomass
    );

    this.activeCount =
      this.targetCount;
  }

  /**
   * Applies the biomass value associated with a specific year.
   *
   * Invalid, missing, or non-positive values leave the previous biomass
   * state unchanged.
   *
   * @param {number} year Dataset year to apply.
   */
  setYear(year) {
    const index =
      year - CONFIG.fish.data.startYear;

    const value = this.values[index];

    if (Number.isFinite(value) && value > 0) {
      this.currentBiomass = value;
      this.setFromBiomass(value);
    }
  }

  /**
   * Maps a biomass value to the swarm population, radius, brightness,
   * cohesion, and movement speed.
   *
   * @param {number} value Biomass value to normalize and apply.
   */
  setFromBiomass(value) {
    const normalizedBiomass =
      constrain(
        value / this.maxBiomass,
        0,
        1
      );

    this.targetCount = floor(
      lerp(
        this.minFish,
        this.maxFish,
        normalizedBiomass
      )
    );

    this.targetRadius = lerp(
      this.minRadius,
      this.maxRadius,
      normalizedBiomass
    );

    this.brightness = lerp(
      CONFIG.fish.individual.biomass.brightness.min,
      CONFIG.fish.individual.biomass.brightness.max,
      normalizedBiomass
    );

    this.cohesion = lerp(
      CONFIG.fish.individual.biomass.cohesion.min,
      CONFIG.fish.individual.biomass.cohesion.max,
      normalizedBiomass
    );

    this.speedLimit = lerp(
      CONFIG.fish.individual.biomass.speedLimit.min,
      CONFIG.fish.individual.biomass.speedLimit.max,
      normalizedBiomass
    );
  }

  /**
   * Advances the complete fish swarm simulation by one frame.
   */
  update() {
    this.updateActiveCount();
    this.updateSwarmCenter();
    this.updateFish();
  }

  /**
   * Moves the active fish count and swarm radius toward their target values.
   *
   * Fish are activated or deactivated one at a time to create gradual
   * population changes.
   */
  updateActiveCount() {
    this.rad = lerp(
      this.rad,
      this.targetRadius,
      CONFIG.fish.swarm.radius.interpolationSpeed
    );

    if (
      this.activeCount <
      this.targetCount
    ) {
      const newFishIndex =
        this.activeCount;

      // Restart the fade-in process when a fish becomes active.
      this.life[newFishIndex] = 0;

      // Prevent a new trail from connecting to an outdated position.
      this.lastTrailPositions[newFishIndex] =
        null;

      this.activeCount++;
    } else if (
      this.activeCount >
      this.targetCount
    ) {
      this.activeCount--;

      this.life[this.activeCount] = 0;

      this.lastTrailPositions[this.activeCount] =
        null;
    }

    this.activeCount = constrain(
      this.activeCount,
      0,
      this.maxParticles
    );
  }

  /**
   * Updates the movement of the swarm center using three-dimensional
   * Perlin-noise forces.
   *
   * The swarm center is kept inside the simulated world after movement.
   */
  updateSwarmCenter() {
    const noiseTime =
      frameCount *
      CONFIG.fish.swarm.movement.noiseTimeSpeed;

    const noiseForce = createVector(
      noise(
        this.noiseOffset +
        noiseTime
      ) - 0.5,

      noise(
        this.noiseOffset +
        CONFIG.fish.swarm.movement.noiseYOffset +
        noiseTime
      ) - 0.5,

      noise(
        this.noiseOffset +
        CONFIG.fish.swarm.movement.noiseZOffset +
        noiseTime
      ) - 0.5
    ).mult(
      CONFIG.fish.swarm.movement.noiseForce
    );

    this.acc.add(noiseForce);
    this.vel.add(this.acc);

    this.vel.limit(
      CONFIG.fish.swarm.movement.baseSpeedLimit +
      stage *
      CONFIG.fish.swarm.movement.stageSpeedIncrease
    );

    this.pos.add(this.vel);

    // Clear acceleration so forces do not accumulate across frames.
    this.acc.mult(0);

    this.keepInside();
  }

  /**
   * Updates the movement, interaction forces, trails, boundaries, and age of
   * every active fish.
   */
  updateFish() {
    for (
      let i = 0;
      i < this.activeCount;
      i++
    ) {
      // Gradually fade newly activated fish into view.
      this.life[i] = lerp(
        this.life[i],
        1.0,
        CONFIG.fish.lifecycle.fadeInSpeed
      );

      const position =
        this.positions[i];

      const velocity =
        this.velocities[i];

      // Calculate a force that keeps the fish near the swarm center.
      const toCenter =
        p5.Vector.sub(
          this.pos,
          position
        );

      const distanceToCenter =
        toCenter.mag();

      const centerForceMultiplier =
        distanceToCenter > this.rad
          ? this.cohesion *
            CONFIG.fish.individual.movement
              .outsideCenterForceMultiplier
          : this.cohesion *
            CONFIG.fish.individual.movement
              .insideCenterForceMultiplier;

      const centerForce =
        toCenter
          .copy()
          .mult(
            centerForceMultiplier
          );

      // Generate independent noise-based movement for the fish.
      const noiseTime =
        frameCount *
        CONFIG.fish.individual.movement.noiseTimeSpeed;

      const noiseForce = createVector(
        noise(
          this.noiseOffsets[i] +
          noiseTime
        ) - 0.5,

        noise(
          this.noiseOffsets[i] +
          CONFIG.fish.individual.movement.noiseYOffset +
          noiseTime
        ) - 0.5,

        noise(
          this.noiseOffsets[i] +
          CONFIG.fish.individual.movement.noiseZOffset +
          noiseTime
        ) - 0.5
      ).mult(
        CONFIG.fish.individual.movement.noiseForce
      );

      velocity.add(centerForce);
      velocity.add(noiseForce);

      // Allow individual fish to inherit part of the swarm-center velocity.
      velocity.add(
        this.vel
          .copy()
          .mult(
            CONFIG.fish.individual.movement
              .swarmVelocityInfluence
          )
      );

      // Apply repulsion generated by user clicks.
      velocity.add(
        this.getClickRepelForce(
          position
        )
      );

      velocity.limit(
        this.speedLimit +
        stage *
        CONFIG.fish.individual.movement
          .stageSpeedIncrease
      );

      // Apply temporary three-dimensional fishing-current forces.
      velocity.add(
        this.getFishingPressureForce(
          position
        )
      );

      position.add(velocity);

      this.drawTrail(
        i,
        position
      );

      this.constrainFishToSwarm(
        i,
        distanceToCenter
      );

      this.age[i] +=
        CONFIG.fish.lifecycle.ageSpeed;
    }
  }

  /**
   * Draws a screen-space trail segment behind an individual fish.
   *
   * Trail brightness and opacity are affected by depth, swarm brightness,
   * and the current fade-in value.
   *
   * @param {number} index Index of the fish in the particle pool.
   * @param {p5.Vector} position Current world-space fish position.
   */
  drawTrail(index, position) {
    const projectedPosition =
      calc_xy(
        position.x,
        position.y,
        position.z
      );

    const previousPosition =
      this.lastTrailPositions[index];

    if (previousPosition) {
      const depth =
        this.getNormalizedDepth(
          position.z
        );

      const depthBrightness = lerp(
        CONFIG.fish.trail.depthBrightness.min,
        CONFIG.fish.trail.depthBrightness.max,
        depth
      );

      const depthAlpha = lerp(
        CONFIG.fish.trail.depthAlpha.min,
        CONFIG.fish.trail.depthAlpha.max,
        depth
      );

      const fishColor =
        this.colors[index];

            const trailVisibility =
        this.life[index];

      const trailRed =
        red(fishColor) *
        depthBrightness *
        trailVisibility;

      const trailGreen =
        green(fishColor) *
        depthBrightness *
        trailVisibility;

      const trailBlue =
        blue(fishColor) *
        depthBrightness *
        trailVisibility;

      const trailAlpha =
        CONFIG.fish.trail.alpha *
        lerp(
          CONFIG.fish.trail.swarmBrightness.min,
          CONFIG.fish.trail.swarmBrightness.max,
          this.brightness
        ) *
        depthAlpha *
        trailVisibility;

      trailLayer.stroke(
        trailRed,
        trailGreen,
        trailBlue,
        trailAlpha
      );

      trailLayer.strokeWeight(
        CONFIG.fish.trail.strokeWeight
      );

      trailLayer.line(
        previousPosition.x,
        previousPosition.y,
        projectedPosition.x,
        projectedPosition.y
      );
    }

    // Store the current projected position for the next trail segment.
    this.lastTrailPositions[index] = {
      x: projectedPosition.x,
      y: projectedPosition.y
    };
  }

  /**
   * Keeps an individual fish within the allowed radius around the swarm
   * center.
   *
   * A fish that crosses the boundary is moved back to the boundary and its
   * velocity is partially reversed.
   *
   * @param {number} index Index of the fish in the particle pool.
   * @param {number} distanceToCenter Current distance from the swarm center.
   */
  constrainFishToSwarm(
    index,
    distanceToCenter
  ) {
    const boundaryRadius =
      this.rad *
      CONFIG.fish.individual.boundary.radiusMultiplier;

    if (
      distanceToCenter <=
      boundaryRadius
    ) {
      return;
    }

    const positionFromCenter =
      p5.Vector.sub(
        this.positions[index],
        this.pos
      );

    positionFromCenter.setMag(
      boundaryRadius
    );

    this.positions[index] =
      p5.Vector.add(
        this.pos,
        positionFromCenter
      );

    this.velocities[index].mult(
      CONFIG.fish.individual.boundary.bounceMultiplier
    );

    // Reset the trail to avoid drawing a line across the corrected position.
    this.lastTrailPositions[index] =
      null;
  }

  /**
   * Packs active fish data into fixed-size shader uniform arrays and renders
   * the swarm to a WEBGL graphics layer.
   *
   * @param {p5.Graphics} pg WEBGL graphics layer used for rendering.
   * @param {p5.Shader} shaderProgram Compiled fish shader.
   */
  drawShader(pg, shaderProgram) {
    const particleData = [];
    const particleInfo = [];

    const shaderParticleLimit =
      CONFIG.fish.rendering.maxShaderParticles;

    const renderCount = min(
      this.activeCount,
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

        const position2D =
          calc_xy(
            position3D.x,
            position3D.y,
            position3D.z
          );

        const scale =
          calc_scaling(
            position3D.x,
            position3D.y,
            position3D.z
          );

        const velocity =
          this.velocities[i];

        const angle =
          atan2(
            velocity.y,
            velocity.x
          ) + PI;

        const fishColor =
          this.colors[i];

        let ageFade =
          1.0 - this.age[i];

        ageFade = constrain(
          ageFade,
          0,
          1
        );

        particleData.push(
          position2D.x,
          position2D.y,
          this.sizes[i] *
          scale,
          angle
        );

        particleInfo.push(
          red(fishColor) / 255,
          green(fishColor) / 255,
          blue(fishColor) / 255,
          this.life[i] *
          this.brightness *
          ageFade
        );
      } else {
        // Fill unused shader array entries with zero values.
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

    pg.noStroke();
    pg.rect(
      0,
      0,
      width,
      height
    );
  }

  /**
   * Converts a world-space z-coordinate into normalized depth.
   *
   * Positive Z values are interpreted as being farther away in the current
   * projection.
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
        1,
        0
      ),
      0,
      1
    );
  }

  /**
   * parses a raw input value and returns a valid number if possible.
   * @param {*} rawValue Raw input value to be validated and parsed.
   * @returns {number|null} Parsed number if valid, otherwise null.
   */
  parseValidValue(rawValue) {
    if (
      rawValue === undefined ||
      rawValue === null ||
      String(rawValue).trim() === ""
    ) {
      return null;
    }

    const value = Number(rawValue);

    return Number.isFinite(value) && value > 0
      ? value
      : null;
  }

  /**
   * Interpolates missing biomass values in a dataset between two years.
   * @param {Object} record Data record containing yearly biomass values.
   * @param {number} startYear First year of the interpolation range.
   * @param {number} endYear Last year of the interpolation range.
   * @returns {Array<number|null>} Array of interpolated biomass values.
   */
  interpolateYearlyValues(record, startYear, endYear) {
    const values = [];

    for (let year = startYear; year <= endYear; year++) {
      const exactValue = this.parseValidValue(record[year]);

      if (exactValue !== null) {
        values.push(exactValue);
        continue;
      }

      let previousYear = null;
      let previousValue = null;

      for (let y = year - 1; y >= startYear; y--) {
        const candidate = this.parseValidValue(record[y]);

        if (candidate !== null) {
          previousYear = y;
          previousValue = candidate;
          break;
        }
      }

      let nextYear = null;
      let nextValue = null;
      for (let y = year + 1; y <= endYear; y++) {
        const candidate = this.parseValidValue(record[y]);
        if (candidate !== null) {
          nextYear = y;
          nextValue = candidate;
          break;
        }
      }
      if (previousValue !== null && nextValue !== null) {
        const progress =
          (year - previousYear) /
          (nextYear - previousYear);
        const interpolatedValue =
          previousValue +
          (nextValue - previousValue) * progress;
        values.push(interpolatedValue);
      } else if (nextValue !== null) {
        values.push(nextValue);
      } else {
        values.push(null);
      }
    }

    return values;
  }

  /**
   * Calculates the combined repulsion force produced by all active clicks.
   *
   * Fish positions are projected into screen space before calculating their
   * distance from each click force.
   *
   * @param {p5.Vector} position3D Current world-space fish position.
   * @returns {p5.Vector} Combined three-dimensional repulsion force.
   */
  getClickRepelForce(position3D) {
    const totalForce =
      createVector(
        0,
        0,
        0
      );

    const position2D =
      calc_xy(
        position3D.x,
        position3D.y,
        position3D.z
      );

    for (
      const force of clickForces
    ) {
      const distanceToForce =
        dist(
          position2D.x,
          position2D.y,
          force.pos.x,
          force.pos.y
        );

      if (
        distanceToForce > 0 &&
        distanceToForce < force.radius
      ) {
        const direction =
          createVector(
            position2D.x -
            force.pos.x,

            position2D.y -
            force.pos.y,

            0
          );

        const intensity =
          map(
            distanceToForce,
            0,
            force.radius,
            force.strength,
            0
          ) *
          force.life;

        direction.normalize();

        totalForce.add(
          direction.mult(
            intensity *
            CONFIG.fish.interaction.clickForceMultiplier
          )
        );
      }
    }

    return totalForce;
  }

  /**
   * Returns the fishing-pressure force acting on one fish.
   *
   * The fishing field operates directly in three-dimensional world space.
   * A zero vector is returned when the field has not been initialized.
   *
   * @param {p5.Vector} position Current world-space fish position.
   * @returns {p5.Vector} Scaled three-dimensional fishing-current force.
   */
  getFishingPressureForce(position) {
    if (!fishingPressureField) {
      return createVector(
        0,
        0,
        0
      );
    }

    return fishingPressureField
      .getForceAtPosition(position)
      .mult(
        CONFIG.fish.interaction
          .fishing.forceMultiplier
      );
  }

  /**
   * Keeps the swarm center inside the simulated three-dimensional world.
   *
   * The corresponding velocity component is reflected when the swarm center
   * reaches an inner boundary. The final position is then clamped to the
   * absolute world dimensions.
   */
  keepInside() {
    const margin =
      CONFIG.fish.worldBoundary.margin;

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
      this.pos.x < minX ||
      this.pos.x > maxX
    ) {
      this.vel.x *= -1;
    }

    if (
      this.pos.y < minY ||
      this.pos.y > maxY
    ) {
      this.vel.y *= -1;
    }

    if (
      this.pos.z < minZ ||
      this.pos.z > maxZ
    ) {
      this.vel.z *= -1;
    }

    this.pos.x = constrain(
      this.pos.x,
      -WORLD.w / 2,
      WORLD.w / 2
    );

    this.pos.y = constrain(
      this.pos.y,
      -WORLD.h / 2,
      WORLD.h / 2
    );

    this.pos.z = constrain(
      this.pos.z,
      -WORLD.d / 2,
      WORLD.d / 2
    );
  }
}