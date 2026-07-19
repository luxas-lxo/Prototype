class CoralDLA2D {
  constructor(options = {}) {
    // Colony configuration
    this.seedCount = options.seedCount ?? 4;
    this.maxNodes = options.maxNodes ?? 1600;
    this.walkersPerFrame = options.walkersPerFrame ?? 6;
    this.stepsPerWalker = options.stepsPerWalker ?? 100;

    // DLA configuration
    this.stepSize = options.stepSize ?? 2.0;
    this.nodeSpacing = options.nodeSpacing ?? 4.0;
    this.stickDistance = options.stickDistance ?? 5.5;
    this.spawnDistance = options.spawnDistance ?? 50;
    this.killDistance = options.killDistance ?? 140;

    // Walker movement
    this.inwardBias = options.inwardBias ?? 0.025;
    this.directionPersistence = options.directionPersistence ?? 0.68;
    this.randomStrength = options.randomStrength ?? 0.32;

    // Screen boundaries
    this.margin = options.margin ?? 0;
    this.boundaryRange = options.boundaryRange ?? 80;
    this.boundarySteering = options.boundarySteering ?? 0.2;

    // Artificial depth
    this.minDepth = options.minDepth ?? 0.0;
    this.maxDepth = options.maxDepth ?? 1.0;
    this.initialDepthMin = options.initialDepthMin ?? 0.35;
    this.initialDepthMax = options.initialDepthMax ?? 0.65;
    this.depthVariation = options.depthVariation ?? 0.055;
    this.depthNoiseScale = options.depthNoiseScale ?? 0.08;

    // Branch width
    this.minWidth = options.minWidth ?? 0.8;
    this.maxWidth = options.maxWidth ?? 5.0;
    this.generationWidthDecay = options.generationWidthDecay ?? 0.018;
    this.depthWidthScale = options.depthWidthScale ?? 0.55;

    // Growth animation
    this.fadeDuration = options.fadeDuration ?? 60;
    this.animateSegmentLength = options.animateSegmentLength ?? true;

    // Color configuration
    this.colors = options.colors ?? CORAL_COLORS;

    // Spatial grid
    this.gridCellSize = options.gridCellSize ?? this.stickDistance * 2.0;
    this.grid = new Map();

    // Runtime data
    this.colonies = [];
    this.totalNodeCount = 0;
    this.finished = false;

    this.createColonies();
  }

  createColonies() {
    this.colonies = [];
    this.grid.clear();
    this.totalNodeCount = 0;
    this.finished = false;

    for (let colonyIndex = 0; colonyIndex < this.seedCount; colonyIndex++) {
      const seedData = this.createSeedAtBoundary();
      const colony = {
        color: color(random(this.colors)),
        seedPosition: seedData.position.copy(),
        inwardDirection: seedData.inwardDirection.copy(),
        nodes: [],
        radius: this.nodeSpacing,
        maxGeneration: 0
      };

      const seedNode = {
        position: seedData.position.copy(),
        parentIndex: -1,
        generation: 0,
        depth: random(this.initialDepthMin, this.initialDepthMax),
        birthFrame: frameCount
      };

      colony.nodes.push(seedNode);
      this.colonies.push(colony);
      this.insertNodeIntoGrid(colonyIndex, 0, seedNode.position);
      this.totalNodeCount++;
    }
  }

  createSeedAtBoundary() {
    const side = floor(random(4));
    const minX = this.margin;
    const maxX = width - this.margin;
    const minY = this.margin;
    const maxY = height - this.margin;

    if (side === 0) {
      return {
        position: createVector(random(minX, maxX), minY),
        inwardDirection: createVector(0, 1)
      };
    }

    if (side === 1) {
      return {
        position: createVector(maxX, random(minY, maxY)),
        inwardDirection: createVector(-1, 0)
      };
    }

    if (side === 2) {
      return {
        position: createVector(random(minX, maxX), maxY),
        inwardDirection: createVector(0, -1)
      };
    }

    return {
      position: createVector(minX, random(minY, maxY)),
      inwardDirection: createVector(1, 0)
    };
  }

  update() {
    if (this.finished) {
      return;
    }

    for (let walkerIndex = 0; walkerIndex < this.walkersPerFrame; walkerIndex++) {
      if (this.totalNodeCount >= this.maxNodes) {
        this.finished = true;
        return;
      }

      const colonyIndex = floor(random(this.colonies.length));

      this.runWalker(colonyIndex);
    }
  }

  runWalker(colonyIndex) {
    const colony = this.colonies[colonyIndex];
    const walker = this.createWalker(colony);

    for (let stepIndex = 0; stepIndex < this.stepsPerWalker; stepIndex++) {
      this.moveWalker(walker, colony);
      this.keepWalkerInside(walker);

      const nearest = this.findNearestNode(walker.position, colonyIndex);

      if (nearest && nearest.distance <= this.stickDistance) {
        return this.attachWalker(colonyIndex, walker, nearest.nodeIndex);
      }

      const distanceFromSeed = p5.Vector.dist(walker.position, colony.seedPosition);

      if (distanceFromSeed > colony.radius + this.killDistance) {
        return false;
      }
    }

    return false;
  }

  createWalker(colony) {
    const angle = random(TWO_PI);
    const spawnRadius = colony.radius + this.spawnDistance;
    const radialDirection = p5.Vector.fromAngle(angle);
    const position = colony.seedPosition.copy().add(radialDirection.copy().mult(spawnRadius));
    const inwardDirection = p5.Vector.sub(colony.seedPosition, position).normalize();
    const randomDirection = p5.Vector.random2D();
    const direction = p5.Vector.lerp(randomDirection, inwardDirection, 0.35).normalize();

    return {
      position: position,
      direction: direction
    };
  }

  moveWalker(walker, colony) {
    const randomDirection = p5.Vector.random2D();
    const towardSeed = p5.Vector.sub(colony.seedPosition, walker.position).normalize();
    const boundaryForce = this.getBoundaryForce(walker.position);

    walker.direction.mult(this.directionPersistence);
    walker.direction.add(randomDirection.mult(this.randomStrength));
    walker.direction.add(towardSeed.mult(this.inwardBias));

    if (boundaryForce.magSq() > 0.000001) {
      boundaryForce.normalize();
      walker.direction.lerp(boundaryForce, this.boundarySteering);
    }

    walker.direction.normalize();
    walker.position.add(walker.direction.copy().mult(this.stepSize));
  }

  attachWalker(colonyIndex, walker, parentIndex) {
    const colony = this.colonies[colonyIndex];
    const parent = colony.nodes[parentIndex];
    const directionFromParent = p5.Vector.sub(walker.position, parent.position);

    if (directionFromParent.magSq() < 0.000001) {
      directionFromParent.set(p5.Vector.random2D());
    }

    directionFromParent.normalize();

    const nodePosition = parent.position.copy().add(directionFromParent.mult(this.nodeSpacing));

    if (!this.isInsideBounds(nodePosition)) {
      return false;
    }

    if (this.hasNodeTooClose(nodePosition, colonyIndex, this.nodeSpacing * 0.7)) {
      return false;
    }

    const generation = parent.generation + 1;
    const depthNoise = noise(this.totalNodeCount * this.depthNoiseScale) - 0.5;
    const depthChange = depthNoise * this.depthVariation * 2.0;
    const depth = constrain(parent.depth + depthChange, this.minDepth, this.maxDepth);
    const nodeIndex = colony.nodes.length;
    const node = {
      position: nodePosition,
      parentIndex: parentIndex,
      generation: generation,
      depth: depth,
      birthFrame: frameCount
    };

    colony.nodes.push(node);
    colony.maxGeneration = max(colony.maxGeneration, generation);
    colony.radius = max(colony.radius, p5.Vector.dist(nodePosition, colony.seedPosition));

    this.insertNodeIntoGrid(colonyIndex, nodeIndex, nodePosition);

    this.totalNodeCount++;

    return true;
  }

  findNearestNode(position, colonyIndex) {
    const gridPosition = this.getGridPosition(position);
    let nearestNodeIndex = -1;
    let nearestDistanceSquared = Infinity;

    for (let offsetX = -1; offsetX <= 1; offsetX++) {
      for (let offsetY = -1; offsetY <= 1; offsetY++) {
        const key = this.getGridKey(gridPosition.x + offsetX, gridPosition.y + offsetY);
        const entries = this.grid.get(key);

        if (!entries) {
          continue;
        }

        for (const entry of entries) {
          if (entry.colonyIndex !== colonyIndex) {
            continue;
          }

          const node = this.colonies[colonyIndex].nodes[entry.nodeIndex];
          const distanceSquared = p5.Vector.sub(position, node.position).magSq();

          if (distanceSquared < nearestDistanceSquared) {
            nearestDistanceSquared = distanceSquared;
            nearestNodeIndex = entry.nodeIndex;
          }
        }
      }
    }

    if (nearestNodeIndex < 0) {
      return null;
    }

    return {
      nodeIndex: nearestNodeIndex,
      distance: sqrt(nearestDistanceSquared)
    };
  }

  hasNodeTooClose(position, colonyIndex, minimumDistance) {
    const nearest = this.findNearestNode(position, colonyIndex);

    return nearest !== null && nearest.distance < minimumDistance;
  }

  insertNodeIntoGrid(colonyIndex, nodeIndex, position) {
    const gridPosition = this.getGridPosition(position);
    const key = this.getGridKey(gridPosition.x, gridPosition.y);

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }

    this.grid.get(key).push({
      colonyIndex: colonyIndex,
      nodeIndex: nodeIndex
    });
  }

  getGridPosition(position) {
    return {
      x: floor(position.x / this.gridCellSize),
      y: floor(position.y / this.gridCellSize)
    };
  }

  getGridKey(x, y) {
    return `${x},${y}`;
  }

  getBoundaryForce(position) {
    const force = createVector(0, 0);
    const minX = this.margin;
    const maxX = width - this.margin;
    const minY = this.margin;
    const maxY = height - this.margin;

    if (position.x < minX + this.boundaryRange) {
      force.x += map(position.x, minX, minX + this.boundaryRange, 1, 0);
    }

    if (position.x > maxX - this.boundaryRange) {
      force.x -= map(position.x, maxX - this.boundaryRange, maxX, 0, 1);
    }

    if (position.y < minY + this.boundaryRange) {
      force.y += map(position.y, minY, minY + this.boundaryRange, 1, 0);
    }

    if (position.y > maxY - this.boundaryRange) {
      force.y -= map(position.y, maxY - this.boundaryRange, maxY, 0, 1);
    }

    return force;
  }

  keepWalkerInside(walker) {
    const minX = this.margin;
    const maxX = width - this.margin;
    const minY = this.margin;
    const maxY = height - this.margin;

    if (walker.position.x < minX) {
      walker.position.x = minX;
      walker.direction.x = abs(walker.direction.x);
    }

    if (walker.position.x > maxX) {
      walker.position.x = maxX;
      walker.direction.x = -abs(walker.direction.x);
    }

    if (walker.position.y < minY) {
      walker.position.y = minY;
      walker.direction.y = abs(walker.direction.y);
    }

    if (walker.position.y > maxY) {
      walker.position.y = maxY;
      walker.direction.y = -abs(walker.direction.y);
    }

    walker.direction.normalize();
  }

  isInsideBounds(position) {
    return position.x >= this.margin && position.x <= width - this.margin && position.y >= this.margin && position.y <= height - this.margin;
  }

  getNodeVisibility(node) {
    if (node.parentIndex < 0) {
      return 1.0;
    }

    const ageInFrames = frameCount - node.birthFrame;
    const linearVisibility = constrain(ageInFrames / this.fadeDuration, 0, 1);

    return linearVisibility * linearVisibility * (3.0 - 2.0 * linearVisibility);
  }

  getNodeWidth(node) {
    const generationWidth = this.maxWidth * exp(-node.generation * this.generationWidthDecay);
    const depthScale = lerp(1.0, this.depthWidthScale, node.depth);

    return max(this.minWidth, generationWidth * depthScale);
  }

  getSegments() {
    const segments = [];

    for (let colonyIndex = 0; colonyIndex < this.colonies.length; colonyIndex++) {
      const colony = this.colonies[colonyIndex];

      for (let nodeIndex = 1; nodeIndex < colony.nodes.length; nodeIndex++) {
        const node = colony.nodes[nodeIndex];
        const parent = colony.nodes[node.parentIndex];
        const visibility = this.getNodeVisibility(node);
        const generationFactor = colony.maxGeneration > 0 ? node.generation / colony.maxGeneration : 0;
        const segmentEnd = this.animateSegmentLength ? p5.Vector.lerp(parent.position, node.position, visibility) : node.position;

        segments.push({
          start: parent.position,
          end: segmentEnd,
          fullEnd: node.position,
          width: this.getNodeWidth(node),
          depth: node.depth,
          generation: node.generation,
          generationFactor: generationFactor,
          visibility: visibility,
          color: colony.color,
          colonyIndex: colonyIndex,
          nodeIndex: nodeIndex,
          parentIndex: node.parentIndex
        });
      }
    }

    return segments;
  }

  drawDebug(pg = window) {
    pg.push();
    pg.strokeCap(ROUND);
    pg.strokeJoin(ROUND);

    for (const segment of this.getSegments()) {
      const depthBrightness = lerp(1.0, 0.42, segment.depth);
      const depthAlpha = lerp(220, 85, segment.depth) * segment.visibility;
      const segmentColor = segment.color;

      pg.stroke(red(segmentColor) * depthBrightness, green(segmentColor) * depthBrightness, blue(segmentColor) * depthBrightness, depthAlpha);
      pg.strokeWeight(segment.width);
      pg.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y);
    }

    pg.pop();
  }

  reset() {
    this.createColonies();
  }

  isFinished() {
    return this.finished;
  }

  getNodeCount() {
    return this.totalNodeCount;
  }

  getColonyCount() {
    return this.colonies.length;
  }
}