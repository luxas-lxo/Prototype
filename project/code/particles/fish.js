class FishSwarm3 {
  constructor(record, cx, cy, cz, options = {}) {
    this.data = record;

    // Swarm movement
    this.pos = createVector(cx, cy, cz);
    this.vel = p5.Vector.random3D().mult(random(0.2, 0.8));
    this.acc = createVector();
    this.noiseOffset = random(10000);

    // Swarm configuration
    this.maxParticles = options.maxParticles || MAX_SHADER_PARTICLES;
    this.minFish = options.minFish || 10;
    this.maxFish = options.maxFish || this.maxParticles;
    this.minRadius = options.minRadius || 90;
    this.maxRadius = options.maxRadius || 300;

    // Individual fish data
    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.life = [];
    this.noiseOffsets = [];
    this.colors = [];
    this.lastTrailPositions = [];

    // Biomass data
    this.values = [];

    for (let year = 1970; year <= 2020; year++) {
      const value = Number(record[year]);

      if (!isNaN(value) && value > 0) {
        this.values.push(value);
      }
    }

    this.maxBiomass = this.values.length > 0 ? max(this.values) : 1;
    this.currentBiomass = this.maxBiomass;

    // Dynamic swarm properties
    this.rad = this.maxRadius;
    this.targetRadius = this.rad;
    this.activeCount = 0;
    this.targetCount = 0;
    this.brightness = 1.0;
    this.cohesion = 0.001;
    this.speedLimit = 1.5;

    // Create all possible fish once
    for (let i = 0; i < this.maxParticles; i++) {
      this.positions.push(createVector(this.pos.x + random(-this.rad, this.rad), this.pos.y + random(-this.rad * 0.5, this.rad * 0.5), this.pos.z + random(-this.rad, this.rad)));
      this.velocities.push(p5.Vector.random3D().mult(random(0.2, 1.0)));
      this.sizes.push(random(5, 11));
      this.life.push(1.0);
      this.noiseOffsets.push(random(10000));
      this.colors.push(color(random(FISH_COLORS)));
      this.lastTrailPositions.push(null);
    }

    this.setFromBiomass(this.currentBiomass);
    this.activeCount = this.targetCount;
  }

  setYear(year) {
    const value = Number(this.data[year]);

    if (!isNaN(value) && value > 0) {
      this.currentBiomass = value;
      this.setFromBiomass(value);
    }
  }

  setFromBiomass(value) {
    const t = constrain(value / this.maxBiomass, 0, 1);

    this.targetCount = floor(lerp(this.minFish, this.maxFish, t));
    this.targetRadius = lerp(this.minRadius, this.maxRadius, t);
    this.brightness = lerp(0.25, 1.0, t);
    this.cohesion = lerp(0.0005, 0.002, t);
    this.speedLimit = lerp(0.7, 2.0, t);
  }

  update() {
    this.updateActiveCount();
    this.updateSwarmCenter();
    this.updateFish();
  }

  updateActiveCount() {
    this.rad = lerp(this.rad, this.targetRadius, 0.04);

    if (this.activeCount < this.targetCount) {
      const newFishIndex = this.activeCount;

      this.life[newFishIndex] = 0;
      this.lastTrailPositions[newFishIndex] = null;
      this.activeCount++;
    } else if (this.activeCount > this.targetCount) {
      this.activeCount--;
      this.life[this.activeCount] = 0;
      this.lastTrailPositions[this.activeCount] = null;
    }

    this.activeCount = constrain(this.activeCount, 0, this.maxParticles);
  }

  updateSwarmCenter() {
    const time = frameCount * 0.006;
    const noiseForce = createVector(noise(this.noiseOffset + time) - 0.5, noise(this.noiseOffset + 1000 + time) - 0.5, noise(this.noiseOffset + 2000 + time) - 0.5).mult(0.08);

    this.acc.add(noiseForce);
    this.vel.add(this.acc);
    this.vel.limit(1.0 + stage * 0.15);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.keepInside();
  }

  updateFish() {
    for (let i = 0; i < this.activeCount; i++) {
      this.life[i] = lerp(this.life[i], 1.0, FISH_FADE_IN_SPEED);
      let position = this.positions[i];
      const velocity = this.velocities[i];
      const toCenter = p5.Vector.sub(this.pos, position);
      const distanceToCenter = toCenter.mag();
      const centerForceMultiplier = distanceToCenter > this.rad ? this.cohesion * 4.0 : this.cohesion * 0.25;
      const centerForce = toCenter.copy().mult(centerForceMultiplier);
      const noiseTime = frameCount * 0.01;
      const noiseForce = createVector(noise(this.noiseOffsets[i] + noiseTime) - 0.5, noise(this.noiseOffsets[i] + 100 + noiseTime) - 0.5, noise(this.noiseOffsets[i] + 200 + noiseTime) - 0.5).mult(0.08);

      velocity.add(centerForce);
      velocity.add(noiseForce);
      velocity.add(this.vel.copy().mult(0.025));
      velocity.add(this.getClickRepelForce(position));
      velocity.limit(this.speedLimit + stage * 0.2);

      position.add(velocity);

      this.drawTrail(i, position);
      this.constrainFishToSwarm(i, distanceToCenter);
    }
  }

  drawTrail(index, position) {
    const projectedPosition = calc_xy(position.x, position.y, position.z);
    const previousPosition = this.lastTrailPositions[index];

    if (previousPosition) {
      const depth = this.getNormalizedDepth(position.z);
      const depthBrightness = lerp(0.55, 1.0, depth);
      const depthAlpha = lerp(0.65, 1.0, depth);
      const fishColor = this.colors[index];
      const trailVisibility = this.life[index];
      const trailRed = red(fishColor) * depthBrightness * trailVisibility;
      const trailGreen = green(fishColor) * depthBrightness * trailVisibility;
      const trailBlue = blue(fishColor) * depthBrightness * trailVisibility;
      const trailAlpha = 42 * lerp(0.65, 1.0, this.brightness) * depthAlpha * this.life[index];

      trailLayer.stroke(trailRed, trailGreen, trailBlue, trailAlpha);
      trailLayer.strokeWeight(1);
      trailLayer.line(previousPosition.x, previousPosition.y, projectedPosition.x, projectedPosition.y);
    }

    this.lastTrailPositions[index] = {
      x: projectedPosition.x,
      y: projectedPosition.y
    };
  }

  constrainFishToSwarm(index, distanceToCenter) {
    if (distanceToCenter <= this.rad * 1.25) {
      return;
    }

    const positionFromCenter = p5.Vector.sub(this.positions[index], this.pos);

    positionFromCenter.setMag(this.rad * 1.25);

    this.positions[index] = p5.Vector.add(this.pos, positionFromCenter);
    this.velocities[index].mult(-0.25);
    this.lastTrailPositions[index] = null;
  }

  drawShader(pg, shaderProgram) {
    const particleData = [];
    const particleInfo = [];
    const renderCount = min(this.activeCount, SHADER_PARTICLE_LIMIT);

    for (let i = 0; i < SHADER_PARTICLE_LIMIT; i++) {
      if (i < renderCount) {
        const position3D = this.positions[i];
        const position2D = calc_xy(position3D.x, position3D.y, position3D.z);
        const scale = calc_scaling(position3D.x, position3D.y, position3D.z);
        const velocity = this.velocities[i];
        const angle = atan2(velocity.y, velocity.x);
        const fishColor = this.colors[i];

        particleData.push(position2D.x, position2D.y, this.sizes[i] * scale, angle);
        particleInfo.push(red(fishColor) / 255, green(fishColor) / 255, blue(fishColor) / 255, this.life[i] * this.brightness);
      } else {
        particleData.push(0, 0, 0, 0);
        particleInfo.push(0, 0, 0, 0);
      }
    }

    pg.shader(shaderProgram);

    shaderProgram.setUniform("u_resolution", [width, height]);
    shaderProgram.setUniform("u_count", renderCount);
    shaderProgram.setUniform("u_particles", particleData);
    shaderProgram.setUniform("u_particleData", particleInfo);

    pg.noStroke();
    pg.rect(0, 0, width, height);
  }

  getNormalizedDepth(z) {
    // Reverse the output values if positive Z represents greater distance in your projection.
    return constrain(map(z, -WORLD.d / 2, WORLD.d / 2, 1, 0), 0, 1);
  }

  getClickRepelForce(position3D) {
    const totalForce = createVector(0, 0, 0);
    const position2D = calc_xy(position3D.x, position3D.y, position3D.z);

    for (const force of clickForces) {
      const distanceToForce = dist(position2D.x, position2D.y, force.pos.x, force.pos.y);

      if (distanceToForce > 0 && distanceToForce < force.radius) {
        const direction = createVector(position2D.x - force.pos.x, position2D.y - force.pos.y, 0);
        const intensity = map(distanceToForce, 0, force.radius, force.strength, 0) * force.life;

        direction.normalize();
        totalForce.add(direction.mult(intensity * 0.08));
      }
    }

    return totalForce;
  }

  keepInside() {
    const margin = 20;
    const minX = -WORLD.w / 2 + margin;
    const maxX = WORLD.w / 2 - margin;
    const minY = -WORLD.h / 2 + margin;
    const maxY = WORLD.h / 2 - margin;
    const minZ = -WORLD.d / 2 + margin;
    const maxZ = WORLD.d / 2 - margin;

    if (this.pos.x < minX || this.pos.x > maxX) {
      this.vel.x *= -1;
    }

    if (this.pos.y < minY || this.pos.y > maxY) {
      this.vel.y *= -1;
    }

    if (this.pos.z < minZ || this.pos.z > maxZ) {
      this.vel.z *= -1;
    }

    this.pos.x = constrain(this.pos.x, -WORLD.w / 2, WORLD.w / 2);
    this.pos.y = constrain(this.pos.y, -WORLD.h / 2, WORLD.h / 2);
    this.pos.z = constrain(this.pos.z, -WORLD.d / 2, WORLD.d / 2);
  }
}