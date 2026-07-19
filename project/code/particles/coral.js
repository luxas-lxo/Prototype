/**
 * Generates multiple two-dimensional coral colonies using
 * diffusion-limited aggregation.
 *
 * Random walkers move around the canvas until they approach an existing
 * coral node. Successful walkers attach to the colony and create branching
 * structures with artificial depth, variable width, color, and growth
 * animation.
 *
 * A spatial grid is used to reduce the cost of nearby-node searches.
 */
class CoralDLA2D {
  /**
   * Creates and initializes the coral growth simulation.
   *
   * @param {Object} options Optional simulation and rendering overrides.
   */
  constructor(options = {}) {
    // Configure the number and simulation rate of coral colonies.
    this.seedCount = max(
      1,
      floor(
        options.seedCount ??
        CONFIG.coral.growth.seedCount
      )
    );

    this.maxNodes = max(
      this.seedCount,
      floor(
        options.maxNodes ??
        CONFIG.coral.growth.maxNodes
      )
    );

    this.walkersPerFrame = max(
      0,
      floor(
        options.walkersPerFrame ??
        CONFIG.coral.growth.walkersPerFrame
      )
    );

    this.stepsPerWalker = max(
      1,
      floor(
        options.stepsPerWalker ??
        CONFIG.coral.growth.stepsPerWalker
      )
    );

    // Configure the distances used by the DLA growth algorithm.
    this.stepSize = max(
      0,
      options.stepSize ??
      CONFIG.coral.dla.stepSize
    );

    this.nodeSpacing = max(
      0.001,
      options.nodeSpacing ??
      CONFIG.coral.dla.nodeSpacing
    );

    this.stickDistance = max(
      this.nodeSpacing,
      options.stickDistance ??
      CONFIG.coral.dla.stickDistance
    );

    this.spawnDistance = max(
      0,
      options.spawnDistance ??
      CONFIG.coral.dla.spawnDistance
    );

    this.killDistance = max(
      0,
      options.killDistance ??
      CONFIG.coral.dla.killDistance
    );

    // Configure random-walker movement.
    this.inwardBias = max(
      0,
      options.inwardBias ??
      CONFIG.coral.walker.inwardBias
    );

    this.directionPersistence = constrain(
      options.directionPersistence ??
      CONFIG.coral.walker.directionPersistence,
      0,
      1
    );

    this.randomStrength = max(
      0,
      options.randomStrength ??
      CONFIG.coral.walker.randomStrength
    );

    this.initialInwardBlend = constrain(
      options.initialInwardBlend ??
      CONFIG.coral.walker.initialInwardBlend,
      0,
      1
    );

    // Configure walker behavior near the canvas boundaries.
    this.margin = max(
      0,
      options.margin ??
      CONFIG.coral.boundary.margin
    );

    this.boundaryRange = max(
      0.001,
      options.boundaryRange ??
      CONFIG.coral.boundary.steeringRange
    );

    this.boundarySteering = constrain(
      options.boundarySteering ??
      CONFIG.coral.boundary.steeringStrength,
      0,
      1
    );

    // Configure the artificial normalized depth assigned to coral nodes.
    this.minDepth =
      options.minDepth ??
      CONFIG.coral.depth.min;

    this.maxDepth = max(
      options.maxDepth ??
      CONFIG.coral.depth.max,
      this.minDepth
    );

    this.initialDepthMin = constrain(
      options.initialDepthMin ??
      CONFIG.coral.depth.initialMin,
      this.minDepth,
      this.maxDepth
    );

    this.initialDepthMax = constrain(
      options.initialDepthMax ??
      CONFIG.coral.depth.initialMax,
      this.initialDepthMin,
      this.maxDepth
    );

    this.depthVariation = max(
      0,
      options.depthVariation ??
      CONFIG.coral.depth.variation
    );

    this.depthNoiseScale = max(
      0,
      options.depthNoiseScale ??
      CONFIG.coral.depth.noiseScale
    );

    // Configure coral branch width.
    this.minWidth = max(
      0,
      options.minWidth ??
      CONFIG.coral.width.min
    );

    this.maxWidth = max(
      options.maxWidth ??
      CONFIG.coral.width.max,
      this.minWidth
    );

    this.generationWidthDecay = max(
      0,
      options.generationWidthDecay ??
      CONFIG.coral.width.generationDecay
    );

    this.depthWidthScale = max(
      0,
      options.depthWidthScale ??
      CONFIG.coral.width.depthScale
    );

    // Configure the visual growth animation.
    this.fadeDuration = max(
      1,
      options.fadeDuration ??
      CONFIG.coral.animation.fadeDuration
    );

    this.animateSegmentLength =
      options.animateSegmentLength ??
      CONFIG.coral.animation.animateSegmentLength;

    // Use custom colony colors or the globally configured palette.
    this.colors =
      options.colors ??
      CONFIG.coral.rendering.colors;

    // Configure the spatial grid used for nearby-node searches.
    const defaultGridCellSize =
      this.stickDistance *
      CONFIG.coral.spatialGrid.cellSizeMultiplier;

    this.gridCellSize = max(
      this.stickDistance,
      options.gridCellSize ??
      defaultGridCellSize
    );

    this.grid = new Map();

    // Initialize mutable simulation data.
    this.colonies = [];
    this.totalNodeCount = 0;
    this.finished = false;

    this.createColonies();
  }

  /**
   * Clears the current simulation and creates all initial coral colonies.
   *
   * Each colony begins with one seed node placed on a random canvas edge.
   */
  createColonies() {
    this.colonies = [];
    this.grid.clear();
    this.totalNodeCount = 0;
    this.finished = false;

    for (
      let colonyIndex = 0;
      colonyIndex < this.seedCount;
      colonyIndex++
    ) {
      const seedData =
        this.createSeedAtBoundary();

      const colony = {
        color: color(
          random(this.colors)
        ),

        seedPosition:
          seedData.position.copy(),

        inwardDirection:
          seedData.inwardDirection.copy(),

        nodes: [],

        radius:
          this.nodeSpacing,

        maxGeneration: 0
      };

      const seedNode = {
        position:
          seedData.position.copy(),

        // A negative parent index identifies the root node.
        parentIndex: -1,

        generation: 0,

        depth: random(
          this.initialDepthMin,
          this.initialDepthMax
        ),

        birthFrame:
          frameCount
      };

      colony.nodes.push(seedNode);
      this.colonies.push(colony);

      this.insertNodeIntoGrid(
        colonyIndex,
        0,
        seedNode.position
      );

      this.totalNodeCount++;
    }
  }

  /**
   * Creates a colony seed on a randomly selected canvas boundary.
   *
   * The returned inward direction points from the selected boundary toward
   * the interior of the canvas.
   *
   * @returns {Object} Seed position and inward-facing direction.
   */
  createSeedAtBoundary() {
    const side = floor(
      random(
        CONFIG.coral.boundary.sideCount
      )
    );

    const minX =
      this.margin;

    const maxX =
      width - this.margin;

    const minY =
      this.margin;

    const maxY =
      height - this.margin;

    // Top boundary.
    if (side === 0) {
      return {
        position: createVector(
          random(minX, maxX),
          minY
        ),

        inwardDirection:
          createVector(0, 1)
      };
    }

    // Right boundary.
    if (side === 1) {
      return {
        position: createVector(
          maxX,
          random(minY, maxY)
        ),

        inwardDirection:
          createVector(-1, 0)
      };
    }

    // Bottom boundary.
    if (side === 2) {
      return {
        position: createVector(
          random(minX, maxX),
          maxY
        ),

        inwardDirection:
          createVector(0, -1)
      };
    }

    // Left boundary.
    return {
      position: createVector(
        minX,
        random(minY, maxY)
      ),

      inwardDirection:
        createVector(1, 0)
    };
  }

  /**
   * Advances coral growth by simulating the configured number of walkers.
   *
   * The simulation stops permanently once the global node limit is reached.
   */
  update() {
    if (this.finished) {
      return;
    }

    for (
      let walkerIndex = 0;
      walkerIndex < this.walkersPerFrame;
      walkerIndex++
    ) {
      if (
        this.totalNodeCount >=
        this.maxNodes
      ) {
        this.finished = true;
        return;
      }

      const colonyIndex = floor(
        random(this.colonies.length)
      );

      this.runWalker(colonyIndex);
    }
  }

  /**
   * Simulates one random walker for a selected colony.
   *
   * The walker attaches when it approaches an existing node. It is discarded
   * when it exceeds its maximum distance or runs out of movement steps.
   *
   * @param {number} colonyIndex Index of the colony being grown.
   * @returns {boolean} True when a new node was attached.
   */
  runWalker(colonyIndex) {
    const colony =
      this.colonies[colonyIndex];

    const walker =
      this.createWalker(colony);

    for (
      let stepIndex = 0;
      stepIndex < this.stepsPerWalker;
      stepIndex++
    ) {
      this.moveWalker(
        walker,
        colony
      );

      this.keepWalkerInside(walker);

      const nearest =
        this.findNearestNode(
          walker.position,
          colonyIndex
        );

      if (
        nearest &&
        nearest.distance <=
        this.stickDistance
      ) {
        return this.attachWalker(
          colonyIndex,
          walker,
          nearest.nodeIndex
        );
      }

      const distanceFromSeed =
        p5.Vector.dist(
          walker.position,
          colony.seedPosition
        );

      if (
        distanceFromSeed >
        colony.radius +
        this.killDistance
      ) {
        return false;
      }
    }

    return false;
  }

  /**
   * Creates a random walker outside the current colony radius.
   *
   * Its initial direction combines random movement with movement toward the
   * colony seed.
   *
   * @param {Object} colony Colony that the walker should approach.
   * @returns {Object} Walker position and normalized movement direction.
   */
  createWalker(colony) {
    const angle =
      random(TWO_PI);

    const spawnRadius =
      colony.radius +
      this.spawnDistance;

    const radialDirection =
      p5.Vector.fromAngle(angle);

    const position =
      colony.seedPosition
        .copy()
        .add(
          radialDirection
            .copy()
            .mult(spawnRadius)
        );

    const inwardDirection =
      p5.Vector.sub(
        colony.seedPosition,
        position
      ).normalize();

    const randomDirection =
      p5.Vector.random2D();

    const direction =
      p5.Vector.lerp(
        randomDirection,
        inwardDirection,
        this.initialInwardBlend
      ).normalize();

    return {
      position,
      direction
    };
  }

  /**
   * Advances a walker by one simulation step.
   *
   * Movement combines its previous direction, random motion, attraction
   * toward the seed, and steering away from canvas boundaries.
   *
   * @param {Object} walker Walker to update.
   * @param {Object} colony Colony the walker is approaching.
   */
  moveWalker(walker, colony) {
    const randomDirection =
      p5.Vector.random2D();

    const towardSeed =
      p5.Vector.sub(
        colony.seedPosition,
        walker.position
      ).normalize();

    const boundaryForce =
      this.getBoundaryForce(
        walker.position
      );

    // Preserve part of the previous movement direction.
    walker.direction.mult(
      this.directionPersistence
    );

    // Add random movement.
    walker.direction.add(
      randomDirection.mult(
        this.randomStrength
      )
    );

    // Pull the walker toward the colony seed.
    walker.direction.add(
      towardSeed.mult(
        this.inwardBias
      )
    );

    // Blend in boundary steering only when a meaningful force exists.
    if (
      boundaryForce.magSq() >
      CONFIG.coral.walker
        .minimumDirectionMagnitudeSquared
    ) {
      boundaryForce.normalize();

      walker.direction.lerp(
        boundaryForce,
        this.boundarySteering
      );
    }

    walker.direction.normalize();

    walker.position.add(
      walker.direction
        .copy()
        .mult(this.stepSize)
    );
  }

  /**
   * Attempts to attach a walker to an existing parent node.
   *
   * A new node is rejected when its position falls outside the canvas or is
   * too close to another node in the same colony.
   *
   * @param {number} colonyIndex Index of the target colony.
   * @param {Object} walker Walker that reached the colony.
   * @param {number} parentIndex Index of the nearest existing node.
   * @returns {boolean} True when a new node was successfully created.
   */
  attachWalker(
    colonyIndex,
    walker,
    parentIndex
  ) {
    const colony =
      this.colonies[colonyIndex];

    const parent =
      colony.nodes[parentIndex];

    const directionFromParent =
      p5.Vector.sub(
        walker.position,
        parent.position
      );

    // Use a random direction if the walker overlaps the parent exactly.
    if (
      directionFromParent.magSq() <
      CONFIG.coral.walker
        .minimumDirectionMagnitudeSquared
    ) {
      directionFromParent.set(
        p5.Vector.random2D()
      );
    }

    directionFromParent.normalize();

    const nodePosition =
      parent.position
        .copy()
        .add(
          directionFromParent.mult(
            this.nodeSpacing
          )
        );

    if (
      !this.isInsideBounds(nodePosition)
    ) {
      return false;
    }

    const minimumNodeDistance =
      this.nodeSpacing *
      CONFIG.coral.dla
        .minimumNodeDistanceFactor;

    if (
      this.hasNodeTooClose(
        nodePosition,
        colonyIndex,
        minimumNodeDistance
      )
    ) {
      return false;
    }

    const generation =
      parent.generation + 1;

    const depthNoise =
      noise(
        this.totalNodeCount *
        this.depthNoiseScale
      ) - 0.5;

    const depthChange =
      depthNoise *
      this.depthVariation *
      CONFIG.coral.depth
        .variationMultiplier;

    const depth = constrain(
      parent.depth + depthChange,
      this.minDepth,
      this.maxDepth
    );

    const nodeIndex =
      colony.nodes.length;

    const node = {
      position:
        nodePosition,

      parentIndex,

      generation,

      depth,

      birthFrame:
        frameCount
    };

    colony.nodes.push(node);

    colony.maxGeneration = max(
      colony.maxGeneration,
      generation
    );

    colony.radius = max(
      colony.radius,
      p5.Vector.dist(
        nodePosition,
        colony.seedPosition
      )
    );

    this.insertNodeIntoGrid(
      colonyIndex,
      nodeIndex,
      nodePosition
    );

    this.totalNodeCount++;

    return true;
  }

  /**
   * Finds the nearest node in one colony using the spatial grid.
   *
   * Only the current grid cell and neighboring cells within the configured
   * search radius are inspected.
   *
   * @param {p5.Vector} position Position from which to search.
   * @param {number} colonyIndex Colony whose nodes should be considered.
   * @returns {Object|null} Nearest node index and distance, or null.
   */
  findNearestNode(
    position,
    colonyIndex
  ) {
    const gridPosition =
      this.getGridPosition(position);

    let nearestNodeIndex = -1;
    let nearestDistanceSquared =
      Infinity;

    const searchRadius =
      CONFIG.coral.spatialGrid
        .searchRadius;

    for (
      let offsetX = -searchRadius;
      offsetX <= searchRadius;
      offsetX++
    ) {
      for (
        let offsetY = -searchRadius;
        offsetY <= searchRadius;
        offsetY++
      ) {
        const key =
          this.getGridKey(
            gridPosition.x + offsetX,
            gridPosition.y + offsetY
          );

        const entries =
          this.grid.get(key);

        if (!entries) {
          continue;
        }

        for (const entry of entries) {
          if (
            entry.colonyIndex !==
            colonyIndex
          ) {
            continue;
          }

          const node =
            this.colonies[colonyIndex]
              .nodes[entry.nodeIndex];

          const distanceSquared =
            p5.Vector.sub(
              position,
              node.position
            ).magSq();

          if (
            distanceSquared <
            nearestDistanceSquared
          ) {
            nearestDistanceSquared =
              distanceSquared;

            nearestNodeIndex =
              entry.nodeIndex;
          }
        }
      }
    }

    if (nearestNodeIndex < 0) {
      return null;
    }

    return {
      nodeIndex:
        nearestNodeIndex,

      distance:
        sqrt(nearestDistanceSquared)
    };
  }

  /**
   * Checks whether a position is too close to another node in a colony.
   *
   * @param {p5.Vector} position Candidate node position.
   * @param {number} colonyIndex Colony to search.
   * @param {number} minimumDistance Required minimum node distance.
   * @returns {boolean} True when another node is closer than allowed.
   */
  hasNodeTooClose(
    position,
    colonyIndex,
    minimumDistance
  ) {
    const nearest =
      this.findNearestNode(
        position,
        colonyIndex
      );

    return (
      nearest !== null &&
      nearest.distance <
      minimumDistance
    );
  }

  /**
   * Inserts a coral node reference into the spatial grid.
   *
   * @param {number} colonyIndex Index of the node's colony.
   * @param {number} nodeIndex Index of the node inside the colony.
   * @param {p5.Vector} position Node position used to select the grid cell.
   */
  insertNodeIntoGrid(
    colonyIndex,
    nodeIndex,
    position
  ) {
    const gridPosition =
      this.getGridPosition(position);

    const key =
      this.getGridKey(
        gridPosition.x,
        gridPosition.y
      );

    if (!this.grid.has(key)) {
      this.grid.set(key, []);
    }

    this.grid.get(key).push({
      colonyIndex,
      nodeIndex
    });
  }

  /**
   * Converts a canvas position into integer spatial-grid coordinates.
   *
   * @param {p5.Vector} position Canvas-space position.
   * @returns {Object} Integer x and y grid coordinates.
   */
  getGridPosition(position) {
    return {
      x: floor(
        position.x /
        this.gridCellSize
      ),

      y: floor(
        position.y /
        this.gridCellSize
      )
    };
  }

  /**
   * Creates the string key used to store one spatial-grid cell.
   *
   * @param {number} x Horizontal grid coordinate.
   * @param {number} y Vertical grid coordinate.
   * @returns {string} Grid cell key.
   */
  getGridKey(x, y) {
    return `${x},${y}`;
  }

  /**
   * Calculates a steering force that pushes walkers away from canvas edges.
   *
   * The force gradually increases as a walker approaches the configured
   * canvas margin.
   *
   * @param {p5.Vector} position Walker position in canvas space.
   * @returns {p5.Vector} Two-dimensional boundary steering force.
   */
  getBoundaryForce(position) {
    const force =
      createVector(0, 0);

    const minX =
      this.margin;

    const maxX =
      width - this.margin;

    const minY =
      this.margin;

    const maxY =
      height - this.margin;

    if (
      position.x <
      minX + this.boundaryRange
    ) {
      force.x += map(
        position.x,
        minX,
        minX + this.boundaryRange,
        1,
        0
      );
    }

    if (
      position.x >
      maxX - this.boundaryRange
    ) {
      force.x -= map(
        position.x,
        maxX - this.boundaryRange,
        maxX,
        0,
        1
      );
    }

    if (
      position.y <
      minY + this.boundaryRange
    ) {
      force.y += map(
        position.y,
        minY,
        minY + this.boundaryRange,
        1,
        0
      );
    }

    if (
      position.y >
      maxY - this.boundaryRange
    ) {
      force.y -= map(
        position.y,
        maxY - this.boundaryRange,
        maxY,
        0,
        1
      );
    }

    return force;
  }

  /**
   * Keeps a walker inside the valid canvas area.
   *
   * The walker position is clamped to the boundary and its direction is
   * reflected back toward the canvas interior.
   *
   * @param {Object} walker Walker to constrain.
   */
  keepWalkerInside(walker) {
    const minX =
      this.margin;

    const maxX =
      width - this.margin;

    const minY =
      this.margin;

    const maxY =
      height - this.margin;

    if (
      walker.position.x <
      minX
    ) {
      walker.position.x =
        minX;

      walker.direction.x =
        abs(walker.direction.x);
    }

    if (
      walker.position.x >
      maxX
    ) {
      walker.position.x =
        maxX;

      walker.direction.x =
        -abs(walker.direction.x);
    }

    if (
      walker.position.y <
      minY
    ) {
      walker.position.y =
        minY;

      walker.direction.y =
        abs(walker.direction.y);
    }

    if (
      walker.position.y >
      maxY
    ) {
      walker.position.y =
        maxY;

      walker.direction.y =
        -abs(walker.direction.y);
    }

    walker.direction.normalize();
  }

  /**
   * Checks whether a position lies inside the valid coral growth area.
   *
   * @param {p5.Vector} position Position to test.
   * @returns {boolean} True when the position is inside the canvas margins.
   */
  isInsideBounds(position) {
    return (
      position.x >= this.margin &&
      position.x <=
        width - this.margin &&
      position.y >= this.margin &&
      position.y <=
        height - this.margin
    );
  }

  /**
   * Calculates the current growth-animation visibility of one node.
   *
   * Root nodes are immediately visible. Other nodes use smoothstep-like
   * interpolation based on the number of frames since their creation.
   *
   * @param {Object} node Coral node to evaluate.
   * @returns {number} Visibility value in the range 0 to 1.
   */
  getNodeVisibility(node) {
    if (node.parentIndex < 0) {
      return 1.0;
    }

    const ageInFrames =
      frameCount -
      node.birthFrame;

    const linearVisibility =
      constrain(
        ageInFrames /
        this.fadeDuration,
        0,
        1
      );

    return (
      linearVisibility *
      linearVisibility *
      (
        3.0 -
        2.0 *
        linearVisibility
      )
    );
  }

  /**
   * Calculates the rendered width of a coral node's branch segment.
   *
   * Width decreases exponentially with generation and is additionally
   * adjusted by artificial depth.
   *
   * @param {Object} node Coral node whose segment width should be calculated.
   * @returns {number} Rendered segment width.
   */
  getNodeWidth(node) {
    const generationWidth =
      this.maxWidth *
      exp(
        -node.generation *
        this.generationWidthDecay
      );

    const depthScale = lerp(
      1.0,
      this.depthWidthScale,
      node.depth
    );

    return max(
      this.minWidth,
      generationWidth *
      depthScale
    );
  }

  /**
   * Converts all colony nodes except root nodes into renderable segments.
   *
   * When segment-length animation is enabled, each segment endpoint moves
   * from its parent toward its final position as the node becomes visible.
   *
   * @returns {Array<Object>} Renderable coral segment descriptions.
   */
  getSegments() {
    const segments = [];

    for (
      let colonyIndex = 0;
      colonyIndex <
        this.colonies.length;
      colonyIndex++
    ) {
      const colony =
        this.colonies[colonyIndex];

      for (
        let nodeIndex = 1;
        nodeIndex <
          colony.nodes.length;
        nodeIndex++
      ) {
        const node =
          colony.nodes[nodeIndex];

        const parent =
          colony.nodes[
            node.parentIndex
          ];

        const visibility =
          this.getNodeVisibility(node);

        const generationFactor =
          colony.maxGeneration > 0
            ? node.generation /
              colony.maxGeneration
            : 0;

        const segmentEnd =
          this.animateSegmentLength
            ? p5.Vector.lerp(
                parent.position,
                node.position,
                visibility
              )
            : node.position;

        segments.push({
          start:
            parent.position,

          end:
            segmentEnd,

          fullEnd:
            node.position,

          width:
            this.getNodeWidth(node),

          depth:
            node.depth,

          generation:
            node.generation,

          generationFactor,

          visibility,

          color:
            colony.color,

          colonyIndex,

          nodeIndex,

          parentIndex:
            node.parentIndex
        });
      }
    }

    return segments;
  }

  /**
   * Draws all coral segments directly to a p5 rendering context.
   *
   * This method is intended for debugging or simple rendering without the
   * separate coral glow pipeline.
   *
   * @param {Object} pg p5.js renderer or graphics layer.
   */
  drawDebug(pg = window) {
    pg.push();
    pg.strokeCap(ROUND);
    pg.strokeJoin(ROUND);

    for (
      const segment of
      this.getSegments()
    ) {
      const depthBrightness = lerp(
        CONFIG.coral.rendering
          .depthBrightness.near,
        CONFIG.coral.rendering
          .depthBrightness.far,
        segment.depth
      );

      const depthAlpha =
        lerp(
          CONFIG.coral.rendering
            .depthAlpha.near,
          CONFIG.coral.rendering
            .depthAlpha.far,
          segment.depth
        ) *
        segment.visibility;

      const segmentColor =
        segment.color;

      pg.stroke(
        red(segmentColor) *
          depthBrightness,

        green(segmentColor) *
          depthBrightness,

        blue(segmentColor) *
          depthBrightness,

        depthAlpha
      );

      pg.strokeWeight(
        segment.width
      );

      pg.line(
        segment.start.x,
        segment.start.y,
        segment.end.x,
        segment.end.y
      );
    }

    pg.pop();
  }

  /**
   * Clears all generated coral structures and starts a new simulation.
   */
  reset() {
    this.createColonies();
  }

  /**
   * Reports whether the configured global node limit has been reached.
   *
   * @returns {boolean} True when coral growth has finished.
   */
  isFinished() {
    return this.finished;
  }

  /**
   * Returns the current number of nodes across all colonies.
   *
   * @returns {number} Total number of coral nodes.
   */
  getNodeCount() {
    return this.totalNodeCount;
  }

  /**
   * Returns the number of active coral colonies.
   *
   * @returns {number} Number of colonies.
   */
  getColonyCount() {
    return this.colonies.length;
  }
}