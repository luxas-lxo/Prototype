class PlanktonGroup3D {
  constructor(cx, cy, cz, options = {}) {
    this.pos = createVector(cx, cy, cz);

    this.maxParticles = options.maxParticles || MAX_PLANKTON_PARTICLES;
    this.activeCount = options.count || this.maxParticles;

    this.spreadX = options.spreadX || WORLD.w * 0.35;
    this.spreadY = options.spreadY || WORLD.h * 0.35;
    this.spreadZ = options.spreadZ || WORLD.d * 0.35;

    this.minSize = options.minSize || 2.0;
    this.maxSize = options.maxSize || 5.0;
    this.maxSpeed = options.maxSpeed || 0.22;
    this.noiseStrength = options.noiseStrength || 0.012;
    this.fadeInSpeed = options.fadeInSpeed || 0.012;

    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.colors = [];
    this.life = [];
    this.noiseOffsets = [];
    this.phases = [];
    this.seeds = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions.push(createVector(this.pos.x + random(-this.spreadX, this.spreadX), this.pos.y + random(-this.spreadY, this.spreadY), this.pos.z + random(-this.spreadZ, this.spreadZ)));
      this.velocities.push(p5.Vector.random3D().mult(random(0.01, this.maxSpeed)));
      this.sizes.push(random(this.minSize, this.maxSize));
      this.colors.push(color(random(PLANKTON_COLORS)));
      this.life.push(0.0);
      this.noiseOffsets.push(random(10000));
      this.phases.push(random(TWO_PI));
      this.seeds.push(random(1000));
    }
  }

  update() {
    for (let i = 0; i < this.activeCount; i++) {
      this.updateParticle(i);
    }
  }

  updateParticle(index) {
    const position = this.positions[index];
    const velocity = this.velocities[index];
    const noiseOffset = this.noiseOffsets[index];
    const noiseTime = frameCount * 0.0025;

    const noiseForce = createVector(noise(noiseOffset + noiseTime) - 0.5, noise(noiseOffset + 1000 + noiseTime) - 0.5, noise(noiseOffset + 2000 + noiseTime) - 0.5).mult(this.noiseStrength);

    velocity.add(noiseForce);
    velocity.limit(this.maxSpeed);
    position.add(velocity);

    this.life[index] = min(this.life[index] + this.fadeInSpeed, 1.0);

    this.keepParticleInside(index);
  }

  keepParticleInside(index) {
    const position = this.positions[index];
    const velocity = this.velocities[index];
    const margin = 10;
    const minX = -WORLD.w / 2 + margin;
    const maxX = WORLD.w / 2 - margin;
    const minY = -WORLD.h / 2 + margin;
    const maxY = WORLD.h / 2 - margin;
    const minZ = -WORLD.d / 2 + margin;
    const maxZ = WORLD.d / 2 - margin;

    if (position.x < minX || position.x > maxX) {
      velocity.x *= -1;
      position.x = constrain(position.x, minX, maxX);
    }

    if (position.y < minY || position.y > maxY) {
      velocity.y *= -1;
      position.y = constrain(position.y, minY, maxY);
    }

    if (position.z < minZ || position.z > maxZ) {
      velocity.z *= -1;
      position.z = constrain(position.z, minZ, maxZ);
    }
  }

  drawShader(pg, shaderProgram) {
    const particleData = [];
    const particleInfo = [];
    const particleStyle = [];
    const renderCount = min(this.activeCount, MAX_PLANKTON_PARTICLES);

    for (let i = 0; i < MAX_PLANKTON_PARTICLES; i++) {
      if (i < renderCount) {
        const position3D = this.positions[i];
        const position2D = calc_xy(position3D.x, position3D.y, position3D.z);
        const scale = calc_scaling(position3D.x, position3D.y, position3D.z);
        const pulse = 1.0 + sin(frameCount * 0.018 + this.phases[i]) * 0.05;
        const particleColor = this.colors[i];
        const depth = this.getNormalizedDepth(position3D.z);
        const depthBrightness = lerp(0.55, 1.0, depth);

        particleData.push(position2D.x, position2D.y, this.sizes[i] * scale * pulse, 0.0);
        particleInfo.push(red(particleColor) / 255 * depthBrightness, green(particleColor) / 255 * depthBrightness, blue(particleColor) / 255 * depthBrightness, this.life[i]);
        particleStyle.push(this.seeds[i], this.phases[i], depth, 0.0);
      } else {
        particleData.push(0, 0, 0, 0);
        particleInfo.push(0, 0, 0, 0);
        particleStyle.push(0, 0, 0, 0);
      }
    }

    pg.shader(shaderProgram);

    shaderProgram.setUniform("u_resolution", [width, height]);
    shaderProgram.setUniform("u_count", renderCount);
    shaderProgram.setUniform("u_particles", particleData);
    shaderProgram.setUniform("u_particleData", particleInfo);
    shaderProgram.setUniform("u_particleStyle", particleStyle);

    pg.noStroke();
    pg.rect(0, 0, width, height);
  }

  getNormalizedDepth(z) {
    return constrain(map(z, -WORLD.d / 2, WORLD.d / 2, 0, 1), 0, 1);
  }
}