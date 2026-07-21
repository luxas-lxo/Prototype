/**
 * Simulates broad three-dimensional fishing-pressure current bands.
 *
 * Each pulse is represented as a moving oriented volume that travels mostly
 * along the x-axis while introducing slight variation in y and z.
 *
 * The field can be queried for force at any three-dimensional position.
 * This allows fish or other particle systems to react to temporary
 * fishing-pressure currents without rendering an explicit fishing net.
 */
class FishingPressureField {
  /**
   * Creates the fishing-pressure field.
   *
   * @param {Object} options Optional simulation overrides.
   */
  constructor(
    data = {},
    options = {}
  ) {
    const config =
      CONFIG.fishingPressure;

    this.data = data;

    // Configure the normalized fishing-pressure intensity.
    this.pressure = constrain(
      options.pressure ??
        config.state.pressure,
      0,
      1
    );

    this.targetPressure =
      this.pressure;

    // Configure pulse spawning and capacity.
    this.maxPulseCount =
      options.maxPulseCount ??
      config.pulses.maxCount;

    this.spawnChancePerFrame =
      options.spawnChancePerFrame ??
      config.pulses.spawnChancePerFrame;

    this.minDuration =
      options.minDuration ??
      config.pulses.duration.min;

    this.maxDuration =
      options.maxDuration ??
      config.pulses.duration.max;

    // Store all active current pulses.
    this.pulses = [];
  }

  /**
   * Updates the fishing-pressure field.
   */
  update() {
    this.updatePressure();
    this.trySpawnPulse();
    this.updatePulses();
  }

  /**
   * Attempts to spawn a new current pulse.
   *
   * The spawn probability scales with the current fishing-pressure value.
   */
  trySpawnPulse() {
    if (
      this.pulses.length >=
      this.maxPulseCount
    ) {
      return;
    }

    if (
      random() <
      this.spawnChancePerFrame *
        this.pressure
    ) {
      this.pulses.push(
        this.createPulse()
      );
    }
  }

  /**
   * Creates one broad current pulse.
   *
   * Pulses enter the world either from the left or right and travel mostly
   * horizontally with only small vertical and depth variation.
   *
   * @returns {Object} Newly created pulse data.
   */
  createPulse() {
    const config =
      CONFIG.fishingPressure;

    const directionSign =
      random() < 0.5
        ? 1
        : -1;

    const direction =
      createVector(
        directionSign,
        random(
          -config.direction.verticalDrift,
          config.direction.verticalDrift
        ),
        random(
          -config.direction.depthDrift,
          config.direction.depthDrift
        )
      ).normalize();

    const pulseLength =
      WORLD.w *
      random(
        config.volume
          .lengthMultiplier.min,
        config.volume
          .lengthMultiplier.max
      );

    const pulseWidth =
      WORLD.h *
      random(
        config.volume
          .widthMultiplier.min,
        config.volume
          .widthMultiplier.max
      );

    const pulseHeight =
      WORLD.d *
      random(
        config.volume
          .heightMultiplier.min,
        config.volume
          .heightMultiplier.max
      );

    const halfLength =
      pulseLength * 0.5;

    const spawnOffset =
      config.spawning.spawnOffset;

    const center =
      createVector(
        directionSign > 0
          ? -WORLD.w / 2 -
            spawnOffset +
            halfLength
          : WORLD.w / 2 +
            spawnOffset -
            halfLength,

        random(
          -WORLD.h *
            config.spawning
              .yRangeMultiplier,
          WORLD.h *
            config.spawning
              .yRangeMultiplier
        ),

        random(
          -WORLD.d *
            config.spawning
              .zRangeMultiplier,
          WORLD.d *
            config.spawning
              .zRangeMultiplier
        )
      );

    const velocity =
      direction.copy().mult(
        random(
          config.motion
            .travelSpeed.min,
          config.motion
            .travelSpeed.max
        )
      );

    const duration =
      floor(
        random(
          this.minDuration,
          this.maxDuration
        )
      );
    
    const visualConfig =
      config.visual;

    const visualLineCount =
      floor(
        lerp(
          visualConfig.lineCount.min,
          visualConfig.lineCount.max + 1,
          this.pressure
        )
      );

    const visualLineCenters =
      Array.from(
        {
          length:
            visualLineCount
        },
        () => ({
          lateral:
            random(
              -config.visual
                .centerOffset.lateral,
              config.visual
                .centerOffset.lateral
            ),

          vertical:
            random(
              -config.visual
                .centerOffset.vertical,
              config.visual
                .centerOffset.vertical
            ),

          longitudinal:
            random(
              -config.visual
                .centerOffset.longitudinal,
              config.visual
                .centerOffset.longitudinal
            )
        })
      );

    return {
      center,
      direction,
      velocity,

      length:
        pulseLength,

      width:
        pulseWidth,

      height:
        pulseHeight,

      strength:
        random(
          config.motion.strength.min,
          config.motion.strength.max
        ) *
        lerp(
          0.35,
          1.0,
          this.pressure
        ),

      turbulenceStrength:
        config.motion
          .turbulenceStrength,

      age: 0,
      duration,

      noiseOffset:
        random(10000),

      visual: {
        lineCount:
          visualLineCount,

        noiseOffset:
          random(10000),

        phaseOffset:
          random(TWO_PI),

        colorIndices:
          Array.from(
            {
              length:
                visualLineCount
            },
            () =>
              floor(
                random(
                  config.visual
                    .colors.length
                )
              )
          ),

        lineCenters:
          visualLineCenters
      }
    };
  }

  /**
   * Updates every active pulse and removes expired pulses.
   */
  updatePulses() {
    for (
      let i =
        this.pulses.length - 1;
      i >= 0;
      i--
    ) {
      const pulse =
        this.pulses[i];

      pulse.center.add(
        pulse.velocity
      );

      pulse.age++;

      if (
        this.isPulseFinished(pulse)
      ) {
        this.pulses.splice(i, 1);
      }
    }
  }

  /**
   * Checks whether a pulse has completed its lifetime.
   *
   * @param {Object} pulse Pulse to test.
   * @returns {boolean} True when the pulse should be removed.
   */
  isPulseFinished(pulse) {
    if (
      pulse.age >
      pulse.duration
    ) {
      return true;
    }

    const margin = 200;

    return (
      pulse.center.x <
        -WORLD.w / 2 - margin ||
      pulse.center.x >
        WORLD.w / 2 + margin
    );
  }

  /**
   * Returns the total fishing-pressure force at a given 3D position.
   *
   * @param {p5.Vector} position Three-dimensional world position.
   * @returns {p5.Vector} Summed force of all active pulses.
   */
  getForceAtPosition(position) {
    const totalForce =
      createVector(0, 0, 0);

    for (const pulse of this.pulses) {
      totalForce.add(
        this.getPulseForce(
          pulse,
          position
        )
      );
    }

    return totalForce;
  }

  /**
   * Calculates the influence of one pulse at a given 3D position.
   *
   * The pulse is treated as an oriented three-dimensional band volume
   * with soft falloff toward all edges.
   *
   * @param {Object} pulse Current pulse.
   * @param {p5.Vector} position Position being evaluated.
   * @returns {p5.Vector} Force contributed by this pulse.
   */
  getPulseForce(
    pulse,
    position
  ) {
    const forward =
      pulse.direction.copy();

    const referenceUp =
      abs(forward.y) > 0.95
        ? createVector(0, 0, 1)
        : createVector(0, 1, 0);

    const side =
      forward
        .copy()
        .cross(referenceUp)
        .normalize();

    const localUp =
      side
        .copy()
        .cross(forward)
        .normalize();

    const relativePosition =
      p5.Vector.sub(
        position,
        pulse.center
      );

    const along =
      relativePosition.dot(
        forward
      );

    const across =
      relativePosition.dot(
        side
      );

    const vertical =
      relativePosition.dot(
        localUp
      );

    const halfLength =
      pulse.length * 0.5;

    const halfWidth =
      pulse.width * 0.5;

    const halfHeight =
      pulse.height * 0.5;

    if (
      abs(along) > halfLength ||
      abs(across) > halfWidth ||
      abs(vertical) > halfHeight
    ) {
      return createVector(0, 0, 0);
    }

    const longitudinalFalloff =
      this.getSoftBandFalloff(
        abs(along),
        halfLength
      );

    const lateralFalloff =
      this.getSoftBandFalloff(
        abs(across),
        halfWidth
      );

    const verticalFalloff =
      this.getSoftBandFalloff(
        abs(vertical),
        halfHeight
      );

    const lifeFalloff =
      this.getPulseLifeFalloff(
        pulse
      );

    const baseInfluence =
      longitudinalFalloff *
      lateralFalloff *
      verticalFalloff *
      lifeFalloff;

    const config =
      CONFIG.fishingPressure;

    const turbulence =
      map(
        noise(
          pulse.noiseOffset,
          along * 0.01,
          frameCount *
            config.motion
              .noiseTimeSpeed
        ),
        0,
        1,
        -1,
        1
      ) *
      pulse.turbulenceStrength *
      baseInfluence;

    const force =
      forward
        .copy()
        .mult(
          pulse.strength *
          baseInfluence
        );

    // Add a small non-horizontal deviation so the current feels organic
    // while remaining dominated by horizontal movement.
    force.add(
      localUp
        .copy()
        .mult(
          turbulence *
          pulse.strength *
          0.25
        )
    );

    force.add(
      side
        .copy()
        .mult(
          turbulence *
          pulse.strength *
          0.15
        )
    );

    return force;
  }

  /**
   * Calculates a soft edge falloff inside one axis of the pulse volume.
   *
   * @param {number} distance Absolute local distance from the pulse center.
   * @param {number} halfExtent Half-size of the pulse on this axis.
   * @returns {number} Influence in the range 0 to 1.
   */
  getSoftBandFalloff(
    distance,
    halfExtent
  ) {
    const normalizedDistance =
      constrain(
        distance / halfExtent,
        0,
        1
      );

    return (
      1 -
      normalizedDistance *
        normalizedDistance *
        (
          3 -
          2 *
            normalizedDistance
        )
    );
  }

  /**
   * Calculates the temporal fade-in and fade-out of a pulse.
   *
   * @param {Object} pulse Pulse being evaluated.
   * @returns {number} Life-based influence in the range 0 to 1.
   */
  getPulseLifeFalloff(pulse) {
    const normalizedAge =
      constrain(
        pulse.age /
          pulse.duration,
        0,
        1
      );

    const fadeIn =
      constrain(
        normalizedAge / 0.15,
        0,
        1
      );

    const fadeOut =
      constrain(
        (1 - normalizedAge) /
          0.2,
        0,
        1
      );

    return min(
      fadeIn,
      fadeOut,
      1
    );
  }

  /**
   * Updates the target normalized fishing-pressure intensity.
   *
   * @param {number} value New target pressure between zero and one.
   */
  setPressure(value) {
    this.targetPressure =
      constrain(
        value,
        0,
        1
      );
  }

  /**
   * Applies the normalized fishing-pressure value associated with a year.
   *
   * @param {number} year Dataset year to apply.
   */
  setYear(year) {
    const value =
      this.data[year];

    if (!Number.isFinite(value)) {
      return;
    }

    this.setPressure(
      value
    );
  }

  /**
   * Smoothly moves the rendered pressure toward the current yearly target.
   */
  updatePressure() {
    this.pressure =
      lerp(
        this.pressure,
        this.targetPressure,
        CONFIG.fishingPressure
          .transition
          .interpolationSpeed
      );

    if (
      abs(
        this.pressure -
        this.targetPressure
      ) < 0.0001
    ) {
      this.pressure =
        this.targetPressure;
    }
  }

  /**
   * Draws a projected wireframe representation of all active fishing-current
   * volumes for development and spatial debugging.
   */
  drawDebug() {
    if (
      !CONFIG.fishingPressure.debug.draw
    ) {
      return;
    }

    push();

    noFill();
    stroke(255, 120);
    strokeWeight(1);

    for (const pulse of this.pulses) {
      const forward =
        pulse.direction.copy().normalize();

      const referenceUp =
        abs(forward.y) > 0.95
          ? createVector(0, 0, 1)
          : createVector(0, 1, 0);

      const side =
        forward
          .copy()
          .cross(referenceUp)
          .normalize();

      const localUp =
        side
          .copy()
          .cross(forward)
          .normalize();

      const halfLength =
        pulse.length * 0.5;

      const halfWidth =
        pulse.width * 0.5;

      const halfHeight =
        pulse.height * 0.5;

      const corners3D = [];

      for (const lengthSign of [-1, 1]) {
        for (const widthSign of [-1, 1]) {
          for (const heightSign of [-1, 1]) {
            const corner =
              pulse.center.copy();

            corner.add(
              forward
                .copy()
                .mult(
                  halfLength *
                  lengthSign
                )
            );

            corner.add(
              side
                .copy()
                .mult(
                  halfWidth *
                  widthSign
                )
            );

            corner.add(
              localUp
                .copy()
                .mult(
                  halfHeight *
                  heightSign
                )
            );

            corners3D.push(corner);
          }
        }
      }

      const corners2D =
        corners3D.map((corner) =>
          calc_xy(
            corner.x,
            corner.y,
            corner.z
          )
        );

      // Connect the projected corners of the current volume.
      const edges = [
        [0, 1],
        [0, 2],
        [0, 4],

        [1, 3],
        [1, 5],

        [2, 3],
        [2, 6],

        [3, 7],

        [4, 5],
        [4, 6],

        [5, 7],
        [6, 7]
      ];

      for (const [startIndex, endIndex] of edges) {
        const start =
          corners2D[startIndex];

        const end =
          corners2D[endIndex];

        line(
          start.x,
          start.y,
          end.x,
          end.y
        );
      }

      // Draw the dominant movement direction through the volume.
      const directionStart3D =
        pulse.center
          .copy()
          .sub(
            forward
              .copy()
              .mult(
                halfLength
              )
          );

      const directionEnd3D =
        pulse.center
          .copy()
          .add(
            forward
              .copy()
              .mult(
                halfLength
              )
          );

      const directionStart2D =
        calc_xy(
          directionStart3D.x,
          directionStart3D.y,
          directionStart3D.z
        );

      const directionEnd2D =
        calc_xy(
          directionEnd3D.x,
          directionEnd3D.y,
          directionEnd3D.z
        );

      stroke(255, 220);
      strokeWeight(2);

      line(
        directionStart2D.x,
        directionStart2D.y,
        directionEnd2D.x,
        directionEnd2D.y
      );

      // Draw a small marker at the current pulse center.
      const projectedCenter =
        calc_xy(
          pulse.center.x,
          pulse.center.y,
          pulse.center.z
        );

      noStroke();
      fill(255, 220);

      circle(
        projectedCenter.x,
        projectedCenter.y,
        5
      );

      noFill();
      stroke(255, 120);
      strokeWeight(1);
    }

    pop();
  }

  /**
   * Draws animated projected flow lines for all active fishing-pressure pulses.
   */
  drawVisuals() {
    if (
      !CONFIG.fishingPressure
        .visual.enabled
    ) {
      return;
    }

    push();

    noFill();
    blendMode(ADD);

    for (
      const pulse of this.pulses
    ) {
      this.drawPulseFlowLines(
        pulse
      );
    }

    pop();
  }

  /**
   * Draws several curved flow lines through one fishing-pressure pulse.
   *
   * @param {Object} pulse Fishing-pressure pulse to render.
   */
  drawPulseFlowLines(pulse) {
    const config =
      CONFIG.fishingPressure.visual;

    const forward =
      pulse.direction.copy().normalize();

    const referenceUp =
      abs(forward.y) > 0.95
        ? createVector(0, 0, 1)
        : createVector(0, 1, 0);

    const side =
      forward
        .copy()
        .cross(referenceUp)
        .normalize();

    const localUp =
      side
        .copy()
        .cross(forward)
        .normalize();

    const visibleLength =
      pulse.length *
      config.lengthMultiplier;

    const halfLength =
      visibleLength * 0.5;

    const spread =
      WORLD.h *
      config.spreadMultiplier;

    const pulseVisibility =
      this.getPulseVisibility(
        pulse
      );

    const pressureFactor =
      lerp(
        0.6,
        1.0,
        this.pressure
      );

    for (
      let lineIndex = 0;
      lineIndex <
        pulse.visual.lineCount;
      lineIndex++
    ) {
      const normalizedLineIndex =
        pulse.visual.lineCount <= 1
          ? 0.5
          : lineIndex /
            (
              pulse.visual.lineCount -
              1
            );

      const lateralOffset =
        lerp(
          -spread,
          spread,
          normalizedLineIndex
        );

      const individualOffset =
        map(
          noise(
            pulse.visual.noiseOffset +
              lineIndex * 4.7
          ),
          0,
          1,
          -spread * 0.22,
          spread * 0.22
        );

      const lineAlpha =
        lerp(
          config.opacity.min,
          config.opacity.max,
          noise(
            pulse.visual.noiseOffset +
              lineIndex * 13.7
          )
        ) *
        pulseVisibility *
        pressureFactor;

      const lineWeight =
        lerp(
          config.strokeWeight.min,
          config.strokeWeight.max,
          noise(
            pulse.visual.noiseOffset +
              lineIndex * 5.2
          )
        );

      const colorIndex =
        lineIndex %
        config.colors.length;

      const lineColor =
        color(
          config.colors[
            colorIndex
          ]
        );

      lineColor.setAlpha(
        lineAlpha
      );

      const centerOffset =
        pulse.visual.lineCenters[
          lineIndex
        ];

      stroke(
        lineColor
      );

      strokeWeight(
        lineWeight
      );

      beginShape();

      for (
        let pointIndex = 0;
        pointIndex <
          config.pointCount;
        pointIndex++
      ) {
        const progress =
          pointIndex /
          (
            config.pointCount -
            1
          );

        const alongDistance =
          lerp(
            -halfLength,
            halfLength,
            progress
          );

        const edgeFade =
          sin(
            progress *
            PI
          );

        const noiseValue =
          noise(
            pulse.visual.noiseOffset +
              lineIndex * 0.7,

            progress *
              config.noise.spatialScale *
              100,

            frameCount *
              config.noise
                .timeSpeed
          );

        const signedNoise =
          map(
            noiseValue,
            0,
            1,
            -1,
            1
          );

        const wave =
          sin(
            progress *
              TWO_PI *
              config.noise.waveCount +
            pulse.visual.phaseOffset +
            frameCount *
              config.noise.timeSpeed *
              4 +
            lineIndex * 0.8
          );

        const secondaryWave =
          sin(
            progress *
              TWO_PI *
              (
                config.noise.waveCount *
                0.45
              ) -
            pulse.visual.phaseOffset *
              0.6 +
            frameCount *
              config.noise.timeSpeed *
              2
          );

        const displacement =
          (
            signedNoise *
              config.noise.noiseWeight +
            wave *
              config.noise.waveWeight +
            secondaryWave *
              0.2
          ) *
          config.noise.displacement *
          edgeFade;

        const point3D =
          pulse.center.copy();

        point3D.add(
          forward
            .copy()
            .mult(
              centerOffset
                .longitudinal
            )
        );

        point3D.add(
          side
            .copy()
            .mult(
              centerOffset
                .lateral
            )
        );

        point3D.add(
          localUp
            .copy()
            .mult(
              centerOffset
                .vertical
            )
        );

        point3D.add(
          forward
            .copy()
            .mult(
              alongDistance
            )
        );

        point3D.add(
          side
            .copy()
            .mult(
              lateralOffset +
              individualOffset +
              displacement
            )
        );

        point3D.add(
          localUp
            .copy()
            .mult(
              displacement *
              0.22
            )
        );

        const point2D =
          calc_xy(
            point3D.x,
            point3D.y,
            point3D.z
          );

        curveVertex(
          point2D.x,
          point2D.y
        );
      }

      endShape();
    }
  }

  /**
   * Returns a visibility factor for a pulse based on its lifetime.
   *
   * Newly spawned pulses fade in during the first frames. Near the end of their
   * lifetime they fade out again before being removed.
   *
   * @param {Object} pulse Fishing-pressure pulse.
   * @returns {number} Visibility factor between 0 and 1.
   */
  getPulseVisibility(pulse) {
    const fadeConfig =
      CONFIG.fishingPressure.visual.fade;

    const fadeInFrames =
      max(1, fadeConfig.inFrames);

    const fadeOutFrames =
      max(1, fadeConfig.outFrames);

    const fadeInFactor =
      constrain(
        pulse.age / fadeInFrames,
        0,
        1
      );

    const remainingFrames =
      max(
        0,
        pulse.duration - pulse.age
      );

    const fadeOutFactor =
      constrain(
        remainingFrames / fadeOutFrames,
        0,
        1
      );

    return min(
      fadeInFactor,
      fadeOutFactor
    );
  }
}