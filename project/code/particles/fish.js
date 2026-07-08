class FishSwarm {
  constructor(num, cx, cy, cz, rad) {
    this.pos = createVector(cx, cy, cz);
    this.vel = p5.Vector.random3D().mult(random(0.2, 0.8));
    this.acc = createVector(0, 0, 0);
    this.rad = rad;
    this.fish = [];

    for (let i = 0; i < num; i++) {
      let x = cx + random(-rad * 0.5, rad * 0.5);
      let y = cy + random(-rad * 0.35, rad * 0.35);
      let z = cz + random(-rad * 0.5, rad * 0.5);

      this.fish.push(new FishPart(x, y, z, this));
    }

    this.noiseOffset = random(10000);
  }

  update() {
    let t = frameCount * 0.006;

    let noiseForce = createVector(
      noise(this.noiseOffset + t) - 0.5,
      noise(this.noiseOffset + 1000 + t) - 0.5,
      noise(this.noiseOffset + 2000 + t) - 0.5
    ).mult(0.08);
    this.acc.add(noiseForce);

    this.vel.add(this.acc);
    this.vel.limit(1.0 + stage * 0.15);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.keepInside();

    for (let fish of this.fish) {
      fish.update(this.fish);
    }
  }

  draw() {
    for (let fish of this.fish) {
      fish.updateVisibility();
      fish.draw();
    }
  }

  keepInside() {
    let margin = 20;

    if (this.pos.x < -WORLD.w / 2 + margin || this.pos.x > WORLD.w / 2 - margin) {
      this.vel.x *= -1;
    }

    if (this.pos.y < -WORLD.h / 2 + margin || this.pos.y > WORLD.h / 2 - margin) {
      this.vel.y *= -1;
    }

    if (this.pos.z < -WORLD.d / 2 + margin || this.pos.z > WORLD.d / 2 - margin) {
      this.vel.z *= -1;
    }

    this.pos.x = constrain(this.pos.x, -WORLD.w / 2, WORLD.w / 2);
    this.pos.y = constrain(this.pos.y, -WORLD.h / 2, WORLD.h / 2);
    this.pos.z = constrain(this.pos.z, -WORLD.d / 2, WORLD.d / 2);
  }
}

class FishPart {
  constructor(x, y, z, swarm) {
    this.pos = createVector(x, y, z);
    this.swarm = swarm;

    this.vel = swarm.vel.copy().add(random(-0.5, 0.5), random(-0.5, 0.5), random(-0.5, 0.5));

    this.acc = createVector(0, 0, 0);
    this.size = random(3, 8);
    this.noiseOffset = random(1000);
    this.life = random(0.7, 1);

    this.targetVisibility = 0.05;
    this.visibility = 0.05;

    this.trail = [];
    this.lastTrailPos = null;
  }

  update(allFish) {
    let toSwarmCenter = p5.Vector.sub(this.swarm.pos, this.pos);
    let distToCenter = toSwarmCenter.mag();

    let centerForce = toSwarmCenter.copy().mult(0.002);

    if (distToCenter > this.swarm.rad * 0.8) {
      centerForce.mult(4);
    }

    let followSwarm = this.swarm.vel.copy().mult(0.03);

    let noiseForce = createVector(
      noise(this.noiseOffset + frameCount * 0.01) - 0.5,
      noise(this.noiseOffset + 100 + frameCount * 0.01) - 0.5,
      noise(this.noiseOffset + 200 + frameCount * 0.01) - 0.5
    ).mult(0.08);

    let separation = createVector(0, 0, 0);

    for (let other of allFish) {
      if (other === this) continue;

      let d = p5.Vector.dist(this.pos, other.pos);

      if (d < 18 && d > 0) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.div(d);
        separation.add(diff);
      }
    }

    separation.mult(0.04);

    let disturbance = stage * 0.015;

    this.acc.add(centerForce);
    this.acc.add(followSwarm);
    this.acc.add(noiseForce);
    this.acc.add(separation);
    this.acc.add(p5.Vector.random3D().mult(disturbance));

    for (let force of clickForces) {
      let p2d = calc_xy(this.pos.x, this.pos.y, this.pos.z);
      let d = dist(p2d.x, p2d.y, force.pos.x, force.pos.y);
    
      if (d < force.radius && d > 0) {
        let away = createVector(p2d.x - force.pos.x, p2d.y - force.pos.y, 0);
    
        away.normalize();
    
        let intensity = map(d, 0, force.radius, force.strength, 0);
        intensity *= force.life;
    
        this.acc.add(away.mult(intensity * 0.08));
      }
    }

    this.vel.add(this.acc);
    this.vel.limit(1.8 + stage * 0.25);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.keepInside();

    let p = calc_xy(this.pos.x, this.pos.y, this.pos.z);

    if (this.lastTrailPos) {
      trailLayer.stroke(80, 220, 255, 50);
      trailLayer.strokeWeight(1);
      trailLayer.line(
        this.lastTrailPos.x,
        this.lastTrailPos.y,
        p.x,
        p.y
      );
    }

    this.lastTrailPos = p;

    this.life = max(0.1, this.life - stage * 0.00015);
  }

  updateVisibility() {
    this.targetVisibility = 0.05;

    let p = calc_xy(this.pos.x, this.pos.y, this.pos.z);

    for (let glow of clickGlows) {

        let d = dist(p.x, p.y, glow.pos.x, glow.pos.y);
        let lightRadius = glow.getLightRadius();

        if (d < lightRadius) {

            let light = map(d, 0, lightRadius, 1, 0);

            this.targetVisibility = max(this.targetVisibility, 0.5 + light * 0.5);

        }
    }

    this.visibility = lerp(this.visibility, this.targetVisibility, 0.18);

    let projected = calc_xy(this.pos.x, this.pos.y, this.pos.z);

    this.trail.push({x: projected.x, y: projected.y});
  }

  keepInside() {
    let toCenter = p5.Vector.sub(this.pos, this.swarm.pos);

    if (toCenter.mag() > this.swarm.rad) {
      toCenter.setMag(this.swarm.rad);
      this.pos = p5.Vector.add(this.swarm.pos, toCenter);
      this.vel.mult(-0.35);
    }

    this.pos.x = constrain(this.pos.x, -WORLD.w / 2, WORLD.w / 2);
    this.pos.y = constrain(this.pos.y, -WORLD.h / 2, WORLD.h / 2);
    this.pos.z = constrain(this.pos.z, -WORLD.d / 2, WORLD.d / 2);
  }

  draw() {

    let p = calc_xy(this.pos.x, this.pos.y, this.pos.z);
    let s = calc_scaling(this.pos.x, this.pos.y, this.pos.z);

    let alpha = 180 * this.life * this.visibility;
    
    noStroke();
    fill(80, 220, 255, alpha);

    push();
    translate(p.x, p.y);

    let angle = atan2(this.vel.y, this.vel.x);
    rotate(angle);

    let w = this.size * 1.8 * s;
    let h = this.size * 0.8 * s;

    noStroke();

    // äußerer Glow
    fill(80, 220, 255, alpha * 0.10);
    ellipse(0, 0, w * 4.0, h * 4.0);

    // mittlerer Glow
    fill(80, 220, 255, alpha * 0.35);
    ellipse(0, 0, w * 2.3, h * 2.3);

    // Kern
    fill(160, 245, 255, alpha);
    ellipse(0, 0, w, h);

    pop();
  }

}

class FishSwarm2 {

    constructor(record, cx, cy, cz) {

        this.data = record;

        this.pos = createVector(cx, cy, cz);

        this.vel = p5.Vector.random3D().mult(random(0.2, 0.8));
        this.acc = createVector();

        this.noiseOffset = random(10000);

        // Zeitreihe extrahieren
        this.values = [];

        for (let y = 1970; y <= 2020; y++) {

            let v = Number(record[y]);

            if (!isNaN(v) && v > 0) {
                this.values.push(v);
            }

        }

        this.maxBiomass = max(this.values);
        this.currentBiomass = this.maxBiomass;

        this.rad = 250;
        this.targetRadius = this.rad;

        this.targetFishCount = 120;

        this.fish = [];

        this.updateSize(true);

    }

    updateSize(initial = false) {

        let t = constrain(
            this.currentBiomass / this.maxBiomass,
            0,
            1
        );

        this.targetFishCount = floor(
            lerp(40, 180, t)
        );

        this.targetRadius = lerp(
            140,
            420,
            t
        );

        if (initial) {

            this.rad = this.targetRadius;

            while (this.fish.length < this.targetFishCount) {
                this.addFish();
            }

        }

    }

    addFish() {

        let x = this.pos.x + random(-this.rad * 0.5, this.rad * 0.5);
        let y = this.pos.y + random(-this.rad * 0.35, this.rad * 0.35);
        let z = this.pos.z + random(-this.rad * 0.5, this.rad * 0.5);

        this.fish.push(
            new FishPart(
                x,
                y,
                z,
                this
            )
        );

    }

    removeFish() {

        if (this.fish.length > 0) {
            this.fish.pop();
        }

    }

    setYear(year) {

        let value = Number(this.data[year]);

        if (!isNaN(value) && value > 0) {

            this.currentBiomass = value;

            this.updateSize();

        }

    }

    update() {

        // Radius weich animieren
        this.rad = lerp(
            this.rad,
            this.targetRadius,
            0.04
        );

        // Schwarmgröße weich animieren
        if (this.fish.length < this.targetFishCount) {

            this.addFish();

        } else if (this.fish.length > this.targetFishCount) {

            this.removeFish();

        }

        //-----------------------------------
        // Schwarmbewegung
        //-----------------------------------

        let t = frameCount * 0.006;

        let noiseForce = createVector(
            noise(this.noiseOffset + t) - 0.5,
            noise(this.noiseOffset + 1000 + t) - 0.5,
            noise(this.noiseOffset + 2000 + t) - 0.5
        ).mult(0.08);

        this.acc.add(noiseForce);

        this.vel.add(this.acc);
        this.vel.limit(1.0 + stage * 0.15);

        this.pos.add(this.vel);

        this.acc.mult(0);

        this.keepInside();

        //-----------------------------------
        // Fische updaten
        //-----------------------------------

        for (let fish of this.fish) {

            fish.update(this.fish);

        }

    }

    draw() {

        for (let fish of this.fish) {

            fish.updateVisibility();
            fish.draw();

        }

    }

    keepInside() {

        let margin = 20;

        if (this.pos.x < -WORLD.w/2 + margin || this.pos.x > WORLD.w/2 - margin)
            this.vel.x *= -1;

        if (this.pos.y < -WORLD.h/2 + margin || this.pos.y > WORLD.h/2 - margin)
            this.vel.y *= -1;

        if (this.pos.z < -WORLD.d/2 + margin || this.pos.z > WORLD.d/2 - margin)
            this.vel.z *= -1;

        this.pos.x = constrain(
            this.pos.x,
            -WORLD.w/2,
            WORLD.w/2
        );

        this.pos.y = constrain(
            this.pos.y,
            -WORLD.h/2,
            WORLD.h/2
        );

        this.pos.z = constrain(
            this.pos.z,
            -WORLD.d/2,
            WORLD.d/2
        );

    }

}

class FishSwarm3 {
  constructor(record, cx, cy, cz, options = {}) {
    this.data = record;

    this.pos = createVector(cx, cy, cz);
    this.vel = p5.Vector.random3D().mult(random(0.2, 0.8));
    this.acc = createVector();

    this.noiseOffset = random(10000);

    this.maxParticles = options.maxParticles || MAX_SHADER_PARTICLES;
    this.minFish = options.minFish || 1;
    this.maxFish = options.maxFish || this.maxParticles;

    this.minRadius = options.minRadius || 90;
    this.maxRadius = options.maxRadius || 300;

    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.life = [];
    this.noiseOffsets = [];

    this.values = [];

    for (let y = 1970; y <= 2020; y++) {
      let v = Number(record[y]);

      if (!isNaN(v) && v > 0) {
        this.values.push(v);
      }
    }

    this.maxBiomass = max(this.values);
    this.currentBiomass = this.maxBiomass;

    this.rad = this.maxRadius;
    this.targetRadius = this.rad;

    this.activeCount = 0;
    this.targetCount = 0;

    this.brightness = 1.0;
    this.cohesion = 0.001;
    this.speedLimit = 1.5;

    this.lastTrailPositions = [];

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions.push(
        createVector(
          this.pos.x + random(-this.rad, this.rad),
          this.pos.y + random(-this.rad * 0.5, this.rad * 0.5),
          this.pos.z + random(-this.rad, this.rad)
        )
      );

      this.velocities.push(
        p5.Vector.random3D().mult(random(0.2, 1.0))
      );

      this.sizes.push(random(5, 11));
      this.life.push(random(0.75, 1.0));
      this.noiseOffsets.push(random(10000));
      this.lastTrailPositions.push(null);
    }

    this.setFromBiomass(this.currentBiomass);
    this.activeCount = this.targetCount;
  }

  setYear(year) {
    let value = Number(this.data[year]);

    if (!isNaN(value) && value > 0) {
      this.currentBiomass = value;
      this.setFromBiomass(value);
    }
  }

  setFromBiomass(value) {
    let t = constrain(value / this.maxBiomass, 0, 1);

    this.targetCount = floor(
      lerp(this.minFish, this.maxFish, t)
    );

    this.targetRadius = lerp(
      this.minRadius,
      this.maxRadius,
      t
    );

    this.brightness = lerp(0.25, 1.0, t);
    this.cohesion = lerp(0.0005, 0.002, t);
    this.speedLimit = lerp(0.7, 2.0, t);
  }

  update() {
    this.rad = lerp(this.rad, this.targetRadius, 0.04);

    if (this.activeCount < this.targetCount) {
      this.activeCount++;
    } else if (this.activeCount > this.targetCount) {
      this.activeCount--;
    }

    this.activeCount = constrain(
      this.activeCount,
      0,
      this.maxParticles
    );

    let t = frameCount * 0.006;

    let noiseForce = createVector(
      noise(this.noiseOffset + t) - 0.5,
      noise(this.noiseOffset + 1000 + t) - 0.5,
      noise(this.noiseOffset + 2000 + t) - 0.5
    ).mult(0.08);

    this.acc.add(noiseForce);

    this.vel.add(this.acc);
    this.vel.limit(1.0 + stage * 0.15);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.keepInside();

    for (let i = 0; i < this.activeCount; i++) {
      let p = this.positions[i];
      let v = this.velocities[i];

      let toCenter = p5.Vector.sub(this.pos, p);
      let d = toCenter.mag();

      let centerForce = createVector();

      if (d > this.rad) {
        centerForce = toCenter.copy().mult(this.cohesion * 4);
      } else {
        centerForce = toCenter.copy().mult(this.cohesion * 0.25);
      }

      let noiseForceFish = createVector(
        noise(this.noiseOffsets[i] + frameCount * 0.01) - 0.5,
        noise(this.noiseOffsets[i] + 100 + frameCount * 0.01) - 0.5,
        noise(this.noiseOffsets[i] + 200 + frameCount * 0.01) - 0.5
      ).mult(0.08);

      v.add(centerForce);
      v.add(noiseForceFish);
      v.add(this.vel.copy().mult(0.025));
      v.add(this.getClickRepelForce(p));

      v.limit(this.speedLimit + stage * 0.2);

      p.add(v);

      let p2 = calc_xy(p.x, p.y, p.z);

      if (this.lastTrailPositions[i]) {
        trailLayer.stroke(80, 220, 255, 14 * this.brightness);
        trailLayer.strokeWeight(1);

        trailLayer.line(
          this.lastTrailPositions[i].x,
          this.lastTrailPositions[i].y,
          p2.x,
          p2.y
        );
      }

      this.lastTrailPositions[i] = {
        x: p2.x,
        y: p2.y
      };

      if (d > this.rad * 1.25) {
        let corrected = p5.Vector.sub(p, this.pos);
        corrected.setMag(this.rad * 1.25);
        this.positions[i] = p5.Vector.add(this.pos, corrected);
        this.velocities[i].mult(-0.25);
      }
    }
  }

  drawShader(pg, shaderProgram) {
    let particleData = [];
    let particleInfo = [];

    for (let i = 0; i < MAX_SHADER_PARTICLES; i++) {
      if (i < this.activeCount) {
        let p3 = this.positions[i];
        let p2 = calc_xy(p3.x, p3.y, p3.z);
        let s = calc_scaling(p3.x, p3.y, p3.z);

        let v = this.velocities[i];
        let angle = atan2(v.y, v.x);

        particleData.push(
          p2.x,
          p2.y,
          this.sizes[i] * s,
          angle
        );

        particleInfo.push(
          this.life[i] * this.brightness,
          0,
          0,
          0
        );
      } else {
        particleData.push(0, 0, 0, 0);
        particleInfo.push(0, 0, 0, 0);
      }
    }

    let glowData = [];
    let glowCount = min(clickGlows.length, MAX_SHADER_GLOWS);

    for (let i = 0; i < MAX_SHADER_GLOWS; i++) {
      if (i < glowCount) {
        let g = clickGlows[i];

        glowData.push(
          g.pos.x,
          g.pos.y,
          g.getLightRadius(),
          g.alpha / 120
        );
      } else {
        glowData.push(0, 0, 0, 0);
      }
    }

    pg.shader(shaderProgram);

    shaderProgram.setUniform("u_resolution", [width, height]);
    shaderProgram.setUniform("u_count", this.activeCount);
    shaderProgram.setUniform("u_particles", particleData);
    shaderProgram.setUniform("u_particleData", particleInfo);
    shaderProgram.setUniform("u_glowCount", glowCount);
    shaderProgram.setUniform("u_glows", glowData);

    pg.noStroke();
    pg.rect(0, 0, width, height);
  }

  getClickRepelForce(p3) {
    let total = createVector(0, 0, 0);
    let p2 = calc_xy(p3.x, p3.y, p3.z);

    for (let force of clickForces) {
      let d = dist(p2.x, p2.y, force.pos.x, force.pos.y);

      if (d < force.radius && d > 0) {
        let away = createVector(
          p2.x - force.pos.x,
          p2.y - force.pos.y,
          0
        );

        away.normalize();

        let intensity = map(
          d,
          0,
          force.radius,
          force.strength,
          0
        );

        intensity *= force.life;

        total.add(
          away.mult(intensity * 0.08)
        );
      }
    }

    return total;
  }

  keepInside() {
    let margin = 20;

    if (this.pos.x < -WORLD.w / 2 + margin || this.pos.x > WORLD.w / 2 - margin) {
      this.vel.x *= -1;
    }

    if (this.pos.y < -WORLD.h / 2 + margin || this.pos.y > WORLD.h / 2 - margin) {
      this.vel.y *= -1;
    }

    if (this.pos.z < -WORLD.d / 2 + margin || this.pos.z > WORLD.d / 2 - margin) {
      this.vel.z *= -1;
    }

    this.pos.x = constrain(this.pos.x, -WORLD.w / 2, WORLD.w / 2);
    this.pos.y = constrain(this.pos.y, -WORLD.h / 2, WORLD.h / 2);
    this.pos.z = constrain(this.pos.z, -WORLD.d / 2, WORLD.d / 2);
  }
}

class DataFishSwarmGPU {
  constructor(record, cx, cy, cz, maxParticles = 500) {
    this.data = record;

    this.pos = createVector(cx, cy, cz);
    this.vel = p5.Vector.random3D().mult(random(0.3, 0.9));
    this.acc = createVector(0, 0, 0);

    this.noiseOffset = random(10000);

    this.maxParticles = maxParticles;
    this.activeCount = 0;
    this.targetCount = 0;

    this.positions = [];
    this.velocities = [];
    this.sizes = [];
    this.life = [];
    this.noiseOffsets = [];

    this.values = [];

    for (let y = 1970; y <= 2020; y++) {
      let v = Number(record[y]);

      if (!isNaN(v) && v > 0) {
        this.values.push(v);
      }
    }

    this.maxBiomass = max(this.values);
    this.currentBiomass = this.maxBiomass;

    this.rad = 260;
    this.targetRadius = 260;

    for (let i = 0; i < this.maxParticles; i++) {
      this.positions.push(
        createVector(
          this.pos.x + random(-this.rad, this.rad),
          this.pos.y + random(-this.rad * 0.6, this.rad * 0.6),
          this.pos.z + random(-this.rad, this.rad)
        )
      );

      this.velocities.push(
        p5.Vector.random3D().mult(random(0.2, 1.2))
      );

      this.sizes.push(random(3, 8));
      this.life.push(random(0.8, 1));
      this.noiseOffsets.push(random(10000));
    }

    this.setFromBiomass(this.currentBiomass);
    this.activeCount = this.targetCount;
  }

  setYear(year) {
    let value = Number(this.data[year]);

    if (!isNaN(value) && value > 0) {
      this.currentBiomass = value;
      this.setFromBiomass(value);
    }
  }

  setFromBiomass(value) {
    let t = constrain(value / this.maxBiomass, 0, 1);

    this.targetCount = floor(lerp(40, this.maxParticles, t));
    this.targetRadius = lerp(120, 520, t);

    this.brightness = lerp(0.25, 1.0, t);
    this.cohesion = lerp(0.0006, 0.002, t);
    this.speedLimit = lerp(0.8, 2.2, t);
  }

  update() {
    this.rad = lerp(this.rad, this.targetRadius, 0.035);

    if (this.activeCount < this.targetCount) {
      this.activeCount += 2;
    } else if (this.activeCount > this.targetCount) {
      this.activeCount -= 2;
    }

    this.activeCount = constrain(
      this.activeCount,
      0,
      this.maxParticles
    );

    let t = frameCount * 0.006;

    let noiseForce = createVector(
      noise(this.noiseOffset + t) - 0.5,
      noise(this.noiseOffset + 1000 + t) - 0.5,
      noise(this.noiseOffset + 2000 + t) - 0.5
    ).mult(0.08);

    this.acc.add(noiseForce);

    this.vel.add(this.acc);
    this.vel.limit(1.2);
    this.pos.add(this.vel);
    this.acc.mult(0);

    this.keepInside();

    for (let i = 0; i < this.activeCount; i++) {
      let p = this.positions[i];
      let v = this.velocities[i];

      let toCenter = p5.Vector.sub(this.pos, p);
      let distToCenter = toCenter.mag();

      let centerForce = createVector(0, 0, 0);

      if (distToCenter > this.rad) {
        centerForce = toCenter.mult(this.cohesion * 4);
      } else {
        centerForce = toCenter.mult(this.cohesion * 0.4);
      }

      let n = createVector(
        noise(this.noiseOffsets[i] + frameCount * 0.01) - 0.5,
        noise(this.noiseOffsets[i] + 100 + frameCount * 0.01) - 0.5,
        noise(this.noiseOffsets[i] + 200 + frameCount * 0.01) - 0.5
      ).mult(0.08);

      let clickRepel = this.getClickRepelForce(p);

      v.add(centerForce);
      v.add(n);
      v.add(this.vel.copy().mult(0.02));
      v.add(clickRepel);

      v.limit(this.speedLimit + stage * 0.2);

      p.add(v);

      if (d > this.rad * 1.25) {
        let pullBack = p5.Vector.sub(this.pos, p);
        pullBack.setMag(0.08);
        this.velocities[i].add(pullBack);
      }
    }
  }

  draw() {
    for (let i = 0; i < this.activeCount; i++) {
      let p3 = this.positions[i];
      let p = calc_xy(p3.x, p3.y, p3.z);
      let s = calc_scaling(p3.x, p3.y, p3.z);

      let visibility = this.getVisibility(p);
      let alpha = 180 * this.life[i] * visibility * this.brightness;

      if (alpha < 2) continue;

      let v = this.velocities[i];

      push();
      translate(p.x, p.y);

      let angle = atan2(v.y, v.x);
      rotate(angle);

      let w = this.sizes[i] * 1.8 * s;
      let h = this.sizes[i] * 0.8 * s;

      noStroke();

      fill(80, 220, 255, alpha * 0.10);
      ellipse(0, 0, w * 4.0, h * 4.0);

      fill(80, 220, 255, alpha * 0.35);
      ellipse(0, 0, w * 2.3, h * 2.3);

      fill(160, 245, 255, alpha);
      ellipse(0, 0, w, h);

      pop();
    }
  }

  getVisibility(projectedPos) {
    let visibility = 0.05;

    for (let glow of clickGlows) {
      let lightRadius = glow.getLightRadius();
      let d = dist(
        projectedPos.x,
        projectedPos.y,
        glow.pos.x,
        glow.pos.y
      );

      if (d < lightRadius) {
        let light = map(d, 0, lightRadius, 1, 0);
        visibility = max(visibility, 0.5 + light * 0.5);
      }
    }

    return visibility;
  }

  getClickRepelForce(p3) {
    let total = createVector(0, 0, 0);
    let p2 = calc_xy(p3.x, p3.y, p3.z);

    for (let force of clickForces) {
      let d = dist(p2.x, p2.y, force.pos.x, force.pos.y);

      if (d < force.radius && d > 0) {
        let away = createVector(
          p2.x - force.pos.x,
          p2.y - force.pos.y,
          0
        );

        away.normalize();

        let intensity = map(d, 0, force.radius, force.strength, 0);
        intensity *= force.life;

        total.add(away.mult(intensity * 0.08));
      }
    }

    return total;
  }

  keepInside() {
    if (this.pos.x > WORLD.w / 2) this.pos.x = -WORLD.w / 2;
    if (this.pos.x < -WORLD.w / 2) this.pos.x = WORLD.w / 2;

    if (this.pos.y > WORLD.h / 2) this.pos.y = -WORLD.h / 2;
    if (this.pos.y < -WORLD.h / 2) this.pos.y = WORLD.h / 2;

    if (this.pos.z > WORLD.d / 2) this.pos.z = -WORLD.d / 2;
    if (this.pos.z < -WORLD.d / 2) this.pos.z = WORLD.d / 2;
  }
}

