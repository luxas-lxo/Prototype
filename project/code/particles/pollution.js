class PollutionField {
  constructor(options = {}) {
    this.pollution = constrain(options.pollution ?? 0.5, 0, 1);

    this.maxPatches = options.maxPatches ?? 18;
    this.maxParticles = options.maxParticles ?? 280;

    this.patchOpacity = options.patchOpacity ?? 0.12;
    this.particleOpacity = options.particleOpacity ?? 0.28;

    this.minPatchRadius = options.minPatchRadius ?? 35;
    this.maxPatchRadius = options.maxPatchRadius ?? 110;

    this.driftSpeed = options.driftSpeed ?? 0.12;
    this.rotationSpeed = options.rotationSpeed ?? 0.0003;

    this.patchColor = options.patchColor ?? "#707070";
    this.particleColor = options.particleColor ?? "#8A8A8A";

    this.patches = [];
    this.particles = [];

    this.renderLayer = createGraphics(width, height);
    this.maskLayer = createGraphics(width, height);

    this.renderLayer.pixelDensity(1);
    this.maskLayer.pixelDensity(1);

    this.createInitialElements();
  }

  createInitialElements() {
    const patchCount = floor(this.maxPatches * this.pollution);
    const particleCount = floor(this.maxParticles * this.pollution);

    for (let i = 0; i < patchCount; i++) {
      this.patches.push(this.createPatch());
    }

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createPatch(x = random(width), y = random(height)) {
    const radius = random(
      this.minPatchRadius,
      this.maxPatchRadius
    );

    const vertexCount = floor(random(5, 9));
    const vertices = [];

    for (let i = 0; i < vertexCount; i++) {
      const angle = map(
        i,
        0,
        vertexCount,
        0,
        TWO_PI
      );

      const localRadius = radius * random(0.55, 1.0);

      vertices.push({
        x: cos(angle) * localRadius,
        y: sin(angle) * localRadius
      });
    }

    return {
      position: createVector(x, y),
      velocity: createVector(
        random(0.18, 0.45),
        random(-0.08, 0.08)
      ).mult(this.driftSpeed),

      radius,
      rotation: random(TWO_PI),
      rotationVelocity: random(
        -this.rotationSpeed,
        this.rotationSpeed
      ),

      vertices,
      intensity: random(0.45, 1.0),
      noiseOffset: random(1000)
    };
  }

  createParticle(patch = null) {
    let x;
    let y;

    if (patch) {
      const angle = random(TWO_PI);
      const distance = random(patch.radius * 1.4);

      x = patch.position.x + cos(angle) * distance;
      y = patch.position.y + sin(angle) * distance;
    } else {
      x = random(width);
      y = random(height);
    }

    return {
      position: createVector(x, y),

      velocity: createVector(
        random(0.12, 0.5),
        random(-0.1, 0.1)
      ).mult(this.driftSpeed),

      size: random(0.5, 4.5),
      length: random(2, 8),
      rotation: random(TWO_PI),
      rotationVelocity: random(-0.004, 0.004),

      opacity: random(0.3, 1.0),
      shapeType: floor(random(3)),
      noiseOffset: random(1000)
    };
  }

  setPollution(value) {
    this.pollution = constrain(value, 0, 1);
  }

  resize(layerWidth, layerHeight) {
    this.renderLayer.resizeCanvas(layerWidth, layerHeight);
    this.maskLayer.resizeCanvas(layerWidth, layerHeight);
  }

  update() {
    this.updateElementCounts();
    this.updatePatches();
    this.updateParticles();
  }

  updateElementCounts() {
    const targetPatchCount = floor(
      this.maxPatches * this.pollution
    );

    const targetParticleCount = floor(
      this.maxParticles * this.pollution
    );

    while (this.patches.length < targetPatchCount) {
      this.patches.push(this.createPatch());
    }

    while (this.patches.length > targetPatchCount) {
      this.patches.pop();
    }

    while (this.particles.length < targetParticleCount) {
      const patch =
        this.patches.length > 0
          ? random(this.patches)
          : null;

      this.particles.push(
        this.createParticle(patch)
      );
    }

    while (
      this.particles.length >
      targetParticleCount
    ) {
      this.particles.pop();
    }
  }

  updatePatches() {
    for (const patch of this.patches) {
      const flow = noise(
        patch.noiseOffset,
        frameCount * 0.002
      );

      patch.position.x += patch.velocity.x;
      patch.position.y += patch.velocity.y;
      patch.position.y += map(
        flow,
        0,
        1,
        -0.08,
        0.08
      );

      patch.rotation += patch.rotationVelocity;

      this.wrapPosition(
        patch.position,
        patch.radius * 1.5
      );
    }
  }

  updateParticles() {
    for (const particle of this.particles) {
      const flowAngle =
        noise(
          particle.noiseOffset,
          frameCount * 0.004
        ) *
        TWO_PI *
        0.35;

      particle.position.x +=
        particle.velocity.x +
        cos(flowAngle) * 0.04;

      particle.position.y +=
        particle.velocity.y +
        sin(flowAngle) * 0.04;

      particle.rotation +=
        particle.rotationVelocity;

      this.wrapPosition(
        particle.position,
        10
      );
    }
  }

  wrapPosition(position, margin) {
    if (position.x > width + margin) {
      position.x = -margin;
    }

    if (position.x < -margin) {
      position.x = width + margin;
    }

    if (position.y > height + margin) {
      position.y = -margin;
    }

    if (position.y < -margin) {
      position.y = height + margin;
    }
  }

  drawPatch(layer, patch, isMask = false) {
    layer.push();
    layer.translate(
      patch.position.x,
      patch.position.y
    );
    layer.rotate(patch.rotation);

    if (isMask) {
      const maskValue =
        255 *
        patch.intensity *
        this.pollution;

      layer.fill(maskValue);
    } else {
      const patchAlpha =
        255 *
        this.patchOpacity *
        patch.intensity *
        this.pollution;

      const patchColor = color(this.patchColor);
      patchColor.setAlpha(patchAlpha);

      layer.fill(patchColor);
    }

    layer.noStroke();
    layer.beginShape();

    for (const vertex of patch.vertices) {
      layer.vertex(vertex.x, vertex.y);
    }

    layer.endShape(CLOSE);
    layer.pop();
  }

  drawParticle(layer, particle) {
    const particleAlpha =
      255 *
      this.particleOpacity *
      particle.opacity *
      this.pollution;

    const particleColor = color(
      this.particleColor
    );

    particleColor.setAlpha(particleAlpha);

    layer.push();
    layer.translate(
      particle.position.x,
      particle.position.y
    );
    layer.rotate(particle.rotation);

    layer.noStroke();
    layer.fill(particleColor);

    if (particle.shapeType === 0) {
      layer.rectMode(CENTER);
      layer.rect(
        0,
        0,
        particle.length,
        particle.size
      );
    } else if (particle.shapeType === 1) {
      layer.beginShape();
      layer.vertex(
        -particle.length * 0.5,
        particle.size * 0.5
      );
      layer.vertex(
        particle.length * 0.5,
        0
      );
      layer.vertex(
        -particle.length * 0.25,
        -particle.size * 0.5
      );
      layer.endShape(CLOSE);
    } else {
      layer.stroke(particleColor);
      layer.strokeWeight(
        max(0.5, particle.size * 0.35)
      );

      layer.line(
        -particle.length * 0.5,
        0,
        particle.length * 0.5,
        0
      );
    }

    layer.pop();
  }

  renderMask() {
    this.maskLayer.push();
    this.maskLayer.clear();
    this.maskLayer.background(0);
    this.maskLayer.blendMode(ADD);

    for (const patch of this.patches) {
      this.drawPatch(
        this.maskLayer,
        patch,
        true
      );
    }

    this.maskLayer.pop();
  }

  renderVisuals() {
    this.renderLayer.push();
    this.renderLayer.clear();
    this.renderLayer.blendMode(BLEND);

    for (const patch of this.patches) {
      this.drawPatch(
        this.renderLayer,
        patch
      );
    }

    for (const particle of this.particles) {
      this.drawParticle(
        this.renderLayer,
        particle
      );
    }

    this.renderLayer.pop();
  }

  getMaskLayer() {
    return this.maskLayer;
  }

  draw() {
    this.update();
    this.renderMask();
    this.renderVisuals();

    push();
    blendMode(BLEND);
    noTint();

    image(
      this.renderLayer,
      0,
      0,
      width,
      height
    );

    pop();
  }
}

class PollutionParticleField {
  constructor(options = {}) {
    this.pollution =
      constrain(
        options.pollution ?? 0.5,
        0,
        1
      );

    this.maxParticles =
      min(
        options.maxParticles ?? 220,
        256
      );

    this.opacity =
      options.opacity ?? 0.45;

    this.driftSpeed =
      options.driftSpeed ?? 0.25;

    this.color =
      this.hexToShaderRGB(
        options.color ?? "#8A8A8A"
      );

    this.particles = [];

    this.layer =
      createGraphics(
        width,
        height,
        WEBGL
      );

    this.layer.pixelDensity(1);

    this.shader =
      this.layer.createShader(
        pollutionParticleVert,
        pollutionParticleFrag
      );

    this.createInitialParticles();
  }

  hexToShaderRGB(hex) {
    const cleaned =
      hex.replace("#", "");

    const fullHex =
      cleaned.length === 3
        ? cleaned
            .split("")
            .map(character =>
              character + character
            )
            .join("")
        : cleaned;

    const value =
      Number.parseInt(fullHex, 16);

    return [
      ((value >> 16) & 255) / 255,
      ((value >> 8) & 255) / 255,
      (value & 255) / 255
    ];
  }

  createInitialParticles() {
    const count =
      floor(
        this.maxParticles *
        this.pollution
      );

    for (let i = 0; i < count; i++) {
      this.particles.push(
        this.createParticle()
      );
    }
  }

  createParticle() {
    const isOpenFragment =
        random() < 0.01;

    return {
        position: createVector(
        random(width),
        random(height)
        ),

        velocity: createVector(
        random(0.15, 0.55),
        random(-0.12, 0.12)
        ).mult(this.driftSpeed),

        length: isOpenFragment
        ? random(10, 24)
        : random(6, 17),

        width: isOpenFragment
        ? random(7, 18)
        : random(5, 13),

        rotation: random(TWO_PI),

        rotationVelocity:
        random(-0.0025, 0.0025),

        opacity: isOpenFragment
        ? random(0.35, 0.75)
        : random(0.45, 1.0),

        shapeType:
        isOpenFragment
            ? 1
            : 0,

        seed: random(10000),

        noiseOffset:
        random(1000)
    };
  }

  setPollution(value) {
    this.pollution =
      constrain(value, 0, 1);
  }

  resize(layerWidth, layerHeight) {
    this.layer.resizeCanvas(
      layerWidth,
      layerHeight
    );
  }

  updateParticleCount() {
    const targetCount =
      floor(
        this.maxParticles *
        this.pollution
      );

    while (
      this.particles.length <
      targetCount
    ) {
      this.particles.push(
        this.createParticle()
      );
    }

    while (
      this.particles.length >
      targetCount
    ) {
      this.particles.pop();
    }
  }

  updateParticles() {
    for (
      const particle of
      this.particles
    ) {
      const flow =
        noise(
          particle.noiseOffset,
          frameCount * 0.004
        );

      const flowAngle =
        map(
          flow,
          0,
          1,
          -0.35,
          0.35
        );

      particle.position.x +=
        particle.velocity.x +
        cos(flowAngle) * 0.035;

      particle.position.y +=
        particle.velocity.y +
        sin(flowAngle) * 0.035;

      particle.rotation +=
        particle.rotationVelocity;

      this.wrapPosition(
        particle.position,
        20
      );
    }
  }

  wrapPosition(position, margin) {
    if (
      position.x >
      width + margin
    ) {
      position.x = -margin;
    }

    if (
      position.x <
      -margin
    ) {
      position.x =
        width + margin;
    }

    if (
      position.y >
      height + margin
    ) {
      position.y = -margin;
    }

    if (
      position.y <
      -margin
    ) {
      position.y =
        height + margin;
    }
  }

  buildUniformData() {
    const particleData = [];
    const extraData = [];

    for (
      let i = 0;
      i < this.maxParticles;
      i++
    ) {
      const particle =
        this.particles[i];

      if (!particle) {
        particleData.push(
          0,
          0,
          0,
          0
        );

        extraData.push(
          0,
          0,
          0,
          0
        );

        continue;
      }

      particleData.push(
        particle.position.x,
        particle.position.y,
        particle.length,
        particle.width
      );

      extraData.push(
        particle.rotation,
        particle.shapeType,
        particle.opacity,
        particle.seed
        );
    }

    return {
      particleData,
      extraData
    };
  }

  update() {
    this.updateParticleCount();
    this.updateParticles();
  }

  render() {
    const {
      particleData,
      extraData
    } = this.buildUniformData();

    this.layer.push();
    this.layer.clear();
    this.layer.blendMode(BLEND);
    this.layer.shader(this.shader);

    this.shader.setUniform(
      "u_resolution",
      [
        this.layer.width,
        this.layer.height
      ]
    );

    this.shader.setUniform(
      "u_particleCount",
      this.particles.length
    );

    this.shader.setUniform(
      "u_particles",
      particleData
    );

    this.shader.setUniform(
      "u_particleData",
      extraData
    );

    this.shader.setUniform(
      "u_color",
      this.color
    );

    this.shader.setUniform(
      "u_opacity",
      this.opacity *
      this.pollution
    );

    this.layer.noStroke();

    this.layer.rect(
      -this.layer.width * 0.5,
      -this.layer.height * 0.5,
      this.layer.width,
      this.layer.height
    );

    this.layer.resetShader();
    this.layer.pop();
  }

  draw() {
    this.update();
    this.render();

    push();
    blendMode(BLEND);
    noTint();

    image(
      this.layer,
      0,
      0,
      width,
      height
    );

    pop();
  }
}