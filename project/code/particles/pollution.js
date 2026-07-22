/**
 * Simulates a two-dimensional pollution field made of large irregular
 * patches and smaller debris particles.
 *
 * The visible elements are rendered to a standard p5.Graphics layer.
 * A separate grayscale mask layer is also generated so the pollution
 * distribution can be reused by other visual effects.
 *
 * The normalized pollution value controls both the number of active
 * elements and their rendered intensity.
 */
class PollutionField {
	/**
	 * Creates the pollution field and its off-screen graphics layers.
	 *
	 * @param {Object} data Normalized pollution values indexed by year.
	 * @param {Object} options Optional simulation and rendering overrides.
	 */
	constructor(data = {}, options = {}) {
		const config = CONFIG.pollution.field;

		// Store annual normalized pollution values.
		this.data = data;

		// Store the most recently applied raw dataset value.
		this.currentPollutionValue = 0;

		// Configure the initially rendered pollution level.
		this.pollution = constrain(
		options.pollution ??
			config.pollution,
		0,
		1
		);

		// Store the pollution level the visualization transitions toward.
		this.targetPollution =
		this.pollution;

		// Configure the maximum number of large pollution patches.
		this.maxPatches = max(0, floor(options.maxPatches ?? config.maxPatches));

		// Configure the maximum number of small pollution particles.
		this.maxParticles = max(0, floor(options.maxParticles ?? config.maxParticles));

		// Configure the overall opacity of pollution patches.
		this.patchOpacity = constrain(options.patchOpacity ?? config.opacity.patch, 0, 1);

		// Configure the overall opacity of small particles.
		this.particleOpacity = constrain(options.particleOpacity ?? config.opacity.particle, 0, 1);

		// Configure the allowed radius range of large pollution patches.
		this.minPatchRadius = max(0, options.minPatchRadius ?? config.patchRadius.min);

		this.maxPatchRadius = max(
			options.maxPatchRadius ?? config.patchRadius.max,
			this.minPatchRadius,
		);

		// Configure the base movement and rotation of pollution elements.
		this.driftSpeed = max(0, options.driftSpeed ?? config.patchMovement.driftSpeed);

		this.rotationSpeed = max(0, options.rotationSpeed ?? config.patchMovement.rotationSpeed);

		// Configure the visible colors of patches and particles.
		this.patchColor = options.patchColor ?? config.colors.patch;

		this.particleColor = options.particleColor ?? config.colors.particle;

		// Store all currently active simulation elements.
		this.patches = [];
		this.particles = [];

		// Create the visible color-rendering layer.
		this.renderLayer = createGraphics(width, height);

		// Create a grayscale mask layer containing only the pollution patches.
		this.maskLayer = createGraphics(width, height);

		this.renderLayer.pixelDensity(config.rendering.pixelDensity);

		this.maskLayer.pixelDensity(config.rendering.pixelDensity);

		this.createInitialElements();

		this.setYear(
			CONFIG.pollution.data.startYear
		);
	}

	/**
	 * Creates the initial number of patches and particles.
	 *
	 * The initial element counts are derived from the normalized pollution
	 * value and the configured maximum counts.
	 */
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

	/**
	 * Creates one irregular polygon-shaped pollution patch.
	 *
	 * The patch receives a random radius, polygon outline, movement velocity,
	 * rotation, intensity, and noise offset.
	 *
	 * @param {number} x Initial horizontal canvas position.
	 * @param {number} y Initial vertical canvas position.
	 * @returns {Object} Newly created pollution patch.
	 */
	createPatch(
		x = null,
		y = null
		) {
		if (
			!Number.isFinite(x) ||
			!Number.isFinite(y)
		) {
			const spawnPosition =
			this.createPatchSpawnPosition();

			x =
			spawnPosition.x;

			y =
			spawnPosition.y;
		}
		const radius = random(this.minPatchRadius, this.maxPatchRadius);

		const patchConfig = CONFIG.pollution.field.patchShape;

		const vertexCount = floor(
			random(patchConfig.vertexCount.min, patchConfig.vertexCount.maxExclusive),
		);

		const vertices = [];

		// Generate an uneven radial polygon around the patch center.
		for (let i = 0; i < vertexCount; i++) {
			const angle = map(i, 0, vertexCount, 0, TWO_PI);

			const localRadius =
				radius * random(patchConfig.radiusFactor.min, patchConfig.radiusFactor.max);

			vertices.push({
				x: cos(angle) * localRadius,

				y: sin(angle) * localRadius,
			});
		}

		return {
			position: createVector(
				x,
				y
			),

			velocity: createVector(
				random(
				CONFIG.pollution.field
					.patchMovement.velocityX.min,
				CONFIG.pollution.field
					.patchMovement.velocityX.max
				),

				random(
				CONFIG.pollution.field
					.patchMovement.velocityY.min,
				CONFIG.pollution.field
					.patchMovement.velocityY.max
				)
			).mult(
				this.driftSpeed
			),

			radius,

			rotation: random(TWO_PI),

			rotationVelocity: random(
				-this.rotationSpeed,
				this.rotationSpeed
			),

			vertices,

			intensity: random(
				CONFIG.pollution.field
				.patchProperties.intensity.min,
				CONFIG.pollution.field
				.patchProperties.intensity.max
			),

			noiseOffset: random(
				CONFIG.pollution.field
				.patchProperties.noiseOffsetMax
			),

			// Controls geometric appearance in the pollution mask.
			scale:
				CONFIG.pollution.field
				.growth.initialScale,

			targetScale:
				CONFIG.pollution.field
				.growth.targetScale,

			isRemoving: false
			};
	}

	/**
	 * Creates one small pollution particle.
	 *
	 * When a patch is provided, the particle is created near that patch.
	 * Otherwise, the particle is placed randomly across the canvas.
	 *
	 * @param {Object|null} patch Optional patch used as a spawn origin.
	 * @returns {Object} Newly created pollution particle.
	 */
	createParticle(patch = null) {
		let x;
		let y;

		if (patch) {
			const angle = random(TWO_PI);

			const distance = random(
				patch.radius * CONFIG.pollution.field.particle.patchSpawnRadiusMultiplier,
			);

			x = patch.position.x + cos(angle) * distance;

			y = patch.position.y + sin(angle) * distance;
		} else {
			x = random(width);
			y = random(height);
		}

		const particleConfig = CONFIG.pollution.field.particle;

		return {
			position: createVector(x, y),

			velocity: createVector(
				random(particleConfig.velocityX.min, particleConfig.velocityX.max),

				random(particleConfig.velocityY.min, particleConfig.velocityY.max),
			).mult(this.driftSpeed),

			size: random(particleConfig.size.min, particleConfig.size.max),

			length: random(particleConfig.length.min, particleConfig.length.max),

			rotation: random(TWO_PI),

			rotationVelocity: random(particleConfig.rotationSpeed.min, particleConfig.rotationSpeed.max),

			opacity: random(particleConfig.opacity.min, particleConfig.opacity.max),

			// Select a rectangle, triangle, or line representation.
			shapeType: floor(random(particleConfig.shapeCount)),

			noiseOffset: random(particleConfig.noiseOffsetMax),
		};
	}

	/**
	 * Updates the normalized target pollution level.
	 *
	 * @param {number} value New pollution value between zero and one.
	 */
	setPollution(value) {
		this.targetPollution =
			constrain(
			value,
			0,
			1
			);
	}

	/**
	 * Applies the exact pollution value associated with a specific year.
	 *
	 * Years before the first available observation contain zero pollution.
	 * Missing years after the dataset leave the previous target unchanged.
	 *
	 * @param {number} year Dataset year to apply.
	 */
	setYear(year) {
		const value =
			this.data[year];

		if (!Number.isFinite(value)) {
			return;
		}

		this.currentPollutionValue =
			value;

		this.setPollution(
			value
		);
	}

	/**
	 * Gradually moves the rendered pollution level toward its yearly target.
	 */
	updatePollutionLevel() {
		this.pollution = lerp(
			this.pollution,
			this.targetPollution,
			CONFIG.pollution.transition
			.interpolationSpeed
		);

		if (
			abs(
			this.pollution -
			this.targetPollution
			) < 0.0001
		) {
			this.pollution =
			this.targetPollution;
		}
	}

	/**
	 * Updates the geometric scale of every pollution patch.
	 *
	 * Newly created patches grow from a point into their complete polygon shape.
	 * Patches marked for removal shrink before being deleted.
	 */
	updatePatchGrowth() {
		const growthConfig =
			CONFIG.pollution.field.growth;

		for (
			let i =
			this.patches.length - 1;
			i >= 0;
			i--
		) {
			const patch =
			this.patches[i];

			const interpolationSpeed =
			patch.isRemoving
				? growthConfig.shrinkSpeed
				: growthConfig.growSpeed;

			patch.scale = lerp(
			patch.scale,
			patch.targetScale,
			interpolationSpeed
			);

			if (
			patch.isRemoving &&
			patch.scale <
				growthConfig.removalThreshold
			) {
			this.patches.splice(
				i,
				1
			);
			}
		}
	}

	/**
	 * Resizes both off-screen graphics layers.
	 *
	 * @param {number} layerWidth New layer width in pixels.
	 * @param {number} layerHeight New layer height in pixels.
	 */
	resize(layerWidth, layerHeight) {
		this.renderLayer.resizeCanvas(layerWidth, layerHeight);

		this.maskLayer.resizeCanvas(layerWidth, layerHeight);
	}

	/**
	 * Advances the complete pollution simulation by one frame.
	 */
	update() {
		this.updatePollutionLevel();
		this.updateElementCounts();
		this.updatePatchGrowth();
		this.updatePatches();
		this.updateParticles();
	}

	/**
	 * Gradually adjusts patch and particle counts toward the current pollution
	 * target.
	 *
	 * New small particles are created near existing patches whenever possible.
	 */
	updateElementCounts() {
	const targetPatchCount =
		floor(
		this.maxPatches *
		this.pollution
		);

	const targetParticleCount =
		floor(
		this.maxParticles *
		this.pollution
		);

	const patchCountStep =
		CONFIG.pollution.transition
		.patchCountStep;

	const particleCountStep =
		CONFIG.pollution.transition
		.particleCountStep;

	let activePatchCount =
		this.patches.filter(
		patch =>
			!patch.isRemoving
		).length;

	// Add a limited number of growing patches per frame.
	for (
		let i = 0;
		i < patchCountStep &&
		activePatchCount <
		targetPatchCount;
		i++
	) {
		this.patches.push(
		this.createPatch()
		);

		activePatchCount++;
	}

	// Mark excessive patches for shrinking.
	let patchesToRemove =
		min(
		patchCountStep,
		max(
			0,
			activePatchCount -
			targetPatchCount
		)
		);

	for (
		let i =
		this.patches.length - 1;
		i >= 0 &&
		patchesToRemove > 0;
		i--
	) {
		const patch =
		this.patches[i];

		if (patch.isRemoving) {
		continue;
		}

		patch.isRemoving = true;
		patch.targetScale = 0;

		patchesToRemove--;
	}

	// Only use patches that are not currently shrinking as spawn origins.
	const availablePatches =
		this.patches.filter(
		patch =>
			!patch.isRemoving
		);

	// Add a limited number of particles per frame.
	for (
		let i = 0;
		i < particleCountStep &&
		this.particles.length <
		targetParticleCount;
		i++
	) {
		const patch =
		availablePatches.length > 0
			? random(
				availablePatches
			)
			: null;

		this.particles.push(
		this.createParticle(
			patch
		)
		);
	}

	// Remove a limited number of particles per frame.
	for (
		let i = 0;
		i < particleCountStep &&
		this.particles.length >
		targetParticleCount;
		i++
	) {
		this.particles.pop();
	}
	}

	/**
	 * Updates the position and rotation of every large pollution patch.
	 *
	 * Perlin noise adds subtle vertical movement in addition to each patch's
	 * base velocity.
	 */
	updatePatches() {
		const movementConfig = CONFIG.pollution.field.patchMovement;

		for (const patch of this.patches) {
			const flow = noise(patch.noiseOffset, frameCount * movementConfig.noiseTimeSpeed);

			patch.position.x += patch.velocity.x;

			patch.position.y += patch.velocity.y;

			patch.position.y += map(
				flow,
				0,
				1,
				movementConfig.verticalFlow.min,
				movementConfig.verticalFlow.max,
			);

			patch.rotation += patch.rotationVelocity;

			this.wrapPosition(patch.position, patch.radius * movementConfig.wrapRadiusMultiplier);
		}
	}

	/**
	 * Updates the position and rotation of every small pollution particle.
	 *
	 * Perlin noise is converted into an angle that adds subtle curved motion
	 * to the particle's base velocity.
	 */
	updateParticles() {
		const particleConfig = CONFIG.pollution.field.particle;

		for (const particle of this.particles) {
			const flowAngle =
				noise(particle.noiseOffset, frameCount * particleConfig.flow.noiseTimeSpeed) *
				TWO_PI *
				particleConfig.flow.angleMultiplier;

			particle.position.x +=
				particle.velocity.x + cos(flowAngle) * particleConfig.flow.movementStrength;

			particle.position.y +=
				particle.velocity.y + sin(flowAngle) * particleConfig.flow.movementStrength;

			particle.rotation += particle.rotationVelocity;

			this.wrapPosition(particle.position, particleConfig.wrapMargin);
		}
	}

	/**
	 * Moves an element to the opposite canvas edge after it leaves the visible
	 * area and its configured outer margin.
	 *
	 * @param {p5.Vector} position Position to wrap.
	 * @param {number} margin Additional off-screen wrapping distance.
	 */
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

	/**
	 * Draws one irregular pollution patch to a graphics layer.
	 *
	 * When mask mode is enabled, the patch is rendered as grayscale intensity
	 * instead of using its visible configured color.
	 *
	 * @param {p5.Graphics} layer Target graphics layer.
	 * @param {Object} patch Patch data to render.
	 * @param {boolean} isMask Whether the patch should be rendered as a mask.
	 */
	drawPatch(layer, patch, isMask = false) {
		layer.push();

		layer.translate(patch.position.x, patch.position.y);

		layer.rotate(patch.rotation);

		if (isMask) {
			this.drawPatchMask(
				layer,
				patch
			);

			layer.pop();
			return;
		} else {
			const patchAlpha =
				CONFIG.pollution.field.rendering.colorChannelMax *
				this.patchOpacity *
				patch.intensity *
				this.pollution;

			const patchColor = color(this.patchColor);

			patchColor.setAlpha(patchAlpha);

			layer.fill(patchColor);
		}

		layer.noStroke();
		layer.beginShape();

		for (
			const vertex of patch.vertices
			) {
			layer.vertex(
				vertex.x *
				patch.scale,

				vertex.y *
				patch.scale
			);
		}

		layer.endShape(CLOSE);
		layer.pop();
	}

	/**
	 * Draws a layered grayscale mask with weaker pollution near the patch edge.
	 *
	 * @param {p5.Graphics} layer Target mask layer.
	 * @param {Object} patch Pollution patch data.
	 */
	drawPatchMask(
	layer,
	patch
	) {
	const config =
		CONFIG.pollution.field;

	const falloffConfig =
		config.maskFalloff;

	const layerCount =
		max(
		1,
		floor(
			falloffConfig.layerCount
		)
		);

	layer.noStroke();

	for (
		let layerIndex =
		layerCount - 1;
		layerIndex >= 0;
		layerIndex--
	) {
		const progress =
		layerCount <= 1
			? 1
			: layerIndex /
			(
				layerCount - 1
			);

		const polygonScale =
		lerp(
			falloffConfig.innerScale,
			2,
			progress
		) *
		patch.scale;

		// Outer layers receive less intensity.
		const centerStrength =
		pow(
			1 - progress,
			falloffConfig.exponent
		);

		const maskValue =
		config.rendering
			.colorChannelMax *
		patch.intensity *
		this.pollution *
		smoothStep(
			0,
			1,
			patch.scale
		) *
		centerStrength;

		layer.fill(
		maskValue
		);

		layer.beginShape();

		for (
		const vertex of patch.vertices
		) {
		layer.vertex(
			vertex.x *
			polygonScale,
			vertex.y *
			polygonScale
		);
		}

		layer.endShape(CLOSE);
	}
	}

	/**
	 * Returns a random patch position outside the configured center exclusion zone.
	 *
	 * @returns {p5.Vector} Valid screen-space spawn position.
	 */
	createPatchSpawnPosition() {
		const config =
			CONFIG.pollution.field
			.spawnExclusion;

		if (!config.enabled) {
			return createVector(
			random(width),
			random(height)
			);
		}

		const exclusionHalfWidth =
			width *
			config.widthMultiplier *
			0.5;

		const exclusionHalfHeight =
			height *
			config.heightMultiplier *
			0.5;

		const centerX =
			width * 0.5;

		const centerY =
			height * 0.5;

		for (
			let attempt = 0;
			attempt < config.maxAttempts;
			attempt++
		) {
			const x =
			random(width);

			const y =
			random(height);

			const isInsideCenterZone =
			abs(
				x -
				centerX
			) <
				exclusionHalfWidth &&
			abs(
				y -
				centerY
			) <
				exclusionHalfHeight;

			if (!isInsideCenterZone) {
			return createVector(
				x,
				y
			);
			}
		}

	// Fallback to a position near one of the canvas edges.
	return createVector(
			random() < 0.5
			? random(
				0,
				centerX -
					exclusionHalfWidth
				)
			: random(
				centerX +
					exclusionHalfWidth,
				width
				),
			random(height)
		);
	}

	/**
	 * Draws one small pollution particle to a graphics layer.
	 *
	 * Depending on its shape type, a particle is rendered as a rectangle,
	 * triangle, or short line fragment.
	 *
	 * @param {p5.Graphics} layer Target graphics layer.
	 * @param {Object} particle Particle data to render.
	 */
	drawParticle(layer, particle) {
		const particleAlpha =
			CONFIG.pollution.field.rendering.colorChannelMax *
			this.particleOpacity *
			particle.opacity *
			this.pollution;

		const particleColor = color(this.particleColor);

		particleColor.setAlpha(particleAlpha);

		layer.push();

		layer.translate(particle.position.x, particle.position.y);

		layer.rotate(particle.rotation);

		layer.noStroke();
		layer.fill(particleColor);

		// Draw a rectangular fragment.
		if (particle.shapeType === 0) {
			layer.rectMode(CENTER);

			layer.rect(0, 0, particle.length, particle.size);
		}

		// Draw a triangular fragment.
		else if (particle.shapeType === 1) {
			layer.beginShape();

			layer.vertex(-particle.length * 0.5, particle.size * 0.5);

			layer.vertex(particle.length * 0.5, 0);

			layer.vertex(-particle.length * 0.25, -particle.size * 0.5);

			layer.endShape(CLOSE);
		}

		// Draw a short line fragment.
		else {
			layer.stroke(particleColor);

			layer.strokeWeight(
				max(
					CONFIG.pollution.field.particle.line.minimumStrokeWeight,

					particle.size * CONFIG.pollution.field.particle.line.strokeWeightFactor,
				),
			);

			layer.line(-particle.length * 0.5, 0, particle.length * 0.5, 0);
		}

		layer.pop();
	}

	/**
	 * Renders all large pollution patches into the grayscale mask layer.
	 */
	renderMask() {
		this.maskLayer.push();
		this.maskLayer.clear();
		this.maskLayer.background(0);
		this.maskLayer.blendMode(ADD);

		for (const patch of this.patches) {
			this.drawPatch(this.maskLayer, patch, true);
		}

		this.maskLayer.pop();
	}

	/**
	 * Renders all visible pollution patches and particles into the color layer.
	 */
	renderVisuals() {
		this.renderLayer.push();
		this.renderLayer.clear();
		this.renderLayer.blendMode(BLEND);

		for (const patch of this.patches) {
			this.drawPatch(this.renderLayer, patch);
		}

		for (const particle of this.particles) {
			this.drawParticle(this.renderLayer, particle);
		}

		this.renderLayer.pop();
	}

	/**
	 * Returns the current grayscale pollution mask.
	 *
	 * @returns {p5.Graphics} Off-screen pollution mask layer.
	 */
	getMaskLayer() {
		return this.maskLayer;
	}

	/**
	 * Updates the simulation, renders both off-screen layers, and composites
	 * the visible pollution layer onto the main canvas.
	 */
	draw() {
		this.update();
		this.renderMask();
		this.renderVisuals();

		push();
		blendMode(BLEND);
		noTint();

		image(this.renderLayer, 0, 0, width, height);

		pop();
	}
}

/**
 * Simulates and renders pollution fragments with a full-screen shader.
 *
 * Particle properties are stored as JavaScript objects and packed into
 * fixed-size uniform arrays before each render pass.
 *
 * The normalized pollution value controls both the active particle count
 * and the final visual opacity of the shader layer.
 */
class PollutionParticleField {
	/**
	 * Creates the shader-based pollution particle field.
	 *
	 * @param {Object} options Optional simulation and rendering overrides.
	 */
	constructor(options = {}) {
		const config = CONFIG.pollution.shaderParticles;

		// Configure the normalized pollution level.
		this.pollution = constrain(options.pollution ?? config.pollution, 0, 1);

		// Keep the particle pool within the fixed GLSL uniform-array capacity.
		this.maxParticles = constrain(
			floor(options.maxParticles ?? config.maxParticles),
			0,
			config.shaderCapacity,
		);

		// Configure the overall opacity of the shader result.
		this.opacity = constrain(options.opacity ?? config.opacity, 0, 1);

		// Configure the base movement multiplier.
		this.driftSpeed = max(0, options.driftSpeed ?? config.driftSpeed);

		// Convert the configured hexadecimal color into normalized shader RGB.
		this.color = this.hexToShaderRGB(options.color ?? config.color);

		// Store all currently active shader particles.
		this.particles = [];

		// Create the off-screen WEBGL layer used to run the particle shader.
		this.layer = createGraphics(width, height, WEBGL);

		this.layer.pixelDensity(config.rendering.pixelDensity);

		// Compile the pollution particle shader for the WEBGL layer.
		this.shader = this.layer.createShader(pollutionParticleVert, pollutionParticleFrag);

		this.createInitialParticles();
	}

	/**
	 * Converts a three- or six-digit hexadecimal color into normalized RGB.
	 *
	 * @param {string} hex Hexadecimal color string.
	 * @returns {number[]} RGB values in the range 0 to 1.
	 */
	hexToShaderRGB(hex) {
		const cleaned = hex.replace("#", "");

		// Expand shorthand colors such as #888 into #888888.
		const fullHex =
			cleaned.length === 3
				? cleaned
						.split("")
						.map((character) => character + character)
						.join("")
				: cleaned;

		const value = Number.parseInt(fullHex, 16);

		const colorChannelMax = CONFIG.pollution.field.rendering.colorChannelMax;

		return [
			((value >> 16) & colorChannelMax) / colorChannelMax,

			((value >> 8) & colorChannelMax) / colorChannelMax,

			(value & colorChannelMax) / colorChannelMax,
		];
	}

	/**
	 * Creates the initial number of active particles.
	 *
	 * The initial count is calculated from the maximum particle count and the
	 * normalized pollution value.
	 */
	createInitialParticles() {
		const count = floor(this.maxParticles * this.pollution);

		for (let i = 0; i < count; i++) {
			this.particles.push(this.createParticle());
		}
	}

	/**
	 * Creates one shader-rendered pollution fragment.
	 *
	 * Most particles use the regular fragment shape. A small configured
	 * percentage uses the open-fragment shape with separate dimensions and
	 * opacity values.
	 *
	 * @returns {Object} Newly created shader-particle data.
	 */
	createParticle() {
		const config = CONFIG.pollution.shaderParticles;

		const shapeConfig = config.shape;

		const movementConfig = config.initialMovement;

		const isOpenFragment = random() < shapeConfig.openFragmentProbability;

		return {
			position: createVector(random(width), random(height)),

			velocity: createVector(
				random(movementConfig.velocityX.min, movementConfig.velocityX.max),

				random(movementConfig.velocityY.min, movementConfig.velocityY.max),
			).mult(this.driftSpeed),

			length: isOpenFragment
				? random(shapeConfig.openLength.min, shapeConfig.openLength.max)
				: random(shapeConfig.regularLength.min, shapeConfig.regularLength.max),

			width: isOpenFragment
				? random(shapeConfig.openWidth.min, shapeConfig.openWidth.max)
				: random(shapeConfig.regularWidth.min, shapeConfig.regularWidth.max),

			rotation: random(TWO_PI),

			rotationVelocity: random(movementConfig.rotationSpeed.min, movementConfig.rotationSpeed.max),

			opacity: isOpenFragment
				? random(shapeConfig.openOpacity.min, shapeConfig.openOpacity.max)
				: random(shapeConfig.regularOpacity.min, shapeConfig.regularOpacity.max),

			shapeType: isOpenFragment ? shapeConfig.openType : shapeConfig.regularType,

			// Random seed used by the fragment shader to vary the particle shape.
			seed: random(config.random.seedMax),

			// Random offset used for independent Perlin-noise movement.
			noiseOffset: random(config.random.noiseOffsetMax),
		};
	}

	/**
	 * Updates the normalized pollution level.
	 *
	 * The active particle count is adjusted during the next update cycle.
	 *
	 * @param {number} value New pollution value between 0 and 1.
	 */
	setPollution(value) {
		this.pollution = constrain(value, 0, 1);
	}

	/**
	 * Resizes the off-screen WEBGL graphics layer.
	 *
	 * @param {number} layerWidth New layer width in pixels.
	 * @param {number} layerHeight New layer height in pixels.
	 */
	resize(layerWidth, layerHeight) {
		this.layer.resizeCanvas(layerWidth, layerHeight);
	}

	/**
	 * Adjusts the active particle count to match the current pollution value.
	 *
	 * New particles are created when the target count increases. Particles are
	 * removed from the end of the array when the target count decreases.
	 */
	updateParticleCount() {
		const targetCount = floor(this.maxParticles * this.pollution);

		while (this.particles.length < targetCount) {
			this.particles.push(this.createParticle());
		}

		while (this.particles.length > targetCount) {
			this.particles.pop();
		}
	}

	/**
	 * Updates the position and rotation of every active particle.
	 *
	 * Perlin noise is mapped to an angle that adds subtle curved movement to
	 * each particle's base velocity.
	 */
	updateParticles() {
		const movementConfig = CONFIG.pollution.shaderParticles.movement;

		for (const particle of this.particles) {
			const flow = noise(particle.noiseOffset, frameCount * movementConfig.noiseTimeSpeed);

			const flowAngle = map(flow, 0, 1, movementConfig.flowAngle.min, movementConfig.flowAngle.max);

			particle.position.x += particle.velocity.x + cos(flowAngle) * movementConfig.flowStrength;

			particle.position.y += particle.velocity.y + sin(flowAngle) * movementConfig.flowStrength;

			particle.rotation += particle.rotationVelocity;

			this.wrapPosition(particle.position, movementConfig.wrapMargin);
		}
	}

	/**
	 * Moves a particle to the opposite canvas edge after it leaves the visible
	 * area and its configured outer margin.
	 *
	 * @param {p5.Vector} position Position to wrap.
	 * @param {number} margin Additional off-screen wrapping distance.
	 */
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

	/**
	 * Packs particle properties into fixed-size shader uniform arrays.
	 *
	 * Unused entries are filled with zeros so the JavaScript arrays always
	 * match the fixed GLSL array capacity.
	 *
	 * @returns {Object} Packed particle and style uniform arrays.
	 */
	buildUniformData() {
		const particleData = [];
		const extraData = [];

		const shaderCapacity = CONFIG.pollution.shaderParticles.shaderCapacity;

		for (let i = 0; i < shaderCapacity; i++) {
			const particle = this.particles[i];

			if (!particle) {
				particleData.push(0, 0, 0, 0);

				extraData.push(0, 0, 0, 0);

				continue;
			}

			// x, y, length, width
			particleData.push(particle.position.x, particle.position.y, particle.length, particle.width);

			// rotation, shape type, opacity, random seed
			extraData.push(particle.rotation, particle.shapeType, particle.opacity, particle.seed);
		}

		return { particleData, extraData };
	}

	/**
	 * Advances the complete shader-particle simulation by one frame.
	 */
	update() {
		this.updateParticleCount();
		this.updateParticles();
	}

	/**
	 * Packs the current particle data and renders it through the pollution
	 * fragment shader.
	 */
	render() {
		const { particleData, extraData } = this.buildUniformData();

		this.layer.push();
		this.layer.clear();
		this.layer.blendMode(BLEND);
		this.layer.shader(this.shader);

		// Pass the current off-screen layer dimensions to the shader.
		this.shader.setUniform("u_resolution", [this.layer.width, this.layer.height]);

		// Tell the shader how many array entries contain active particles.
		this.shader.setUniform("u_particleCount", this.particles.length);

		// Pass screen position and particle dimensions to the shader.
		this.shader.setUniform("u_particles", particleData);

		// Pass rotation, shape type, opacity, and random seed to the shader.
		this.shader.setUniform("u_particleData", extraData);

		this.shader.setUniform("u_color", this.color);

		// Pollution affects both particle count and final layer opacity.
		this.shader.setUniform("u_opacity", this.opacity * this.pollution);

		// Draw a full-screen rectangle so the fragment shader runs per pixel.
		this.layer.noStroke();

		this.layer.rect(
			-this.layer.width * 0.5,
			-this.layer.height * 0.5,
			this.layer.width,
			this.layer.height,
		);

		this.layer.resetShader();
		this.layer.pop();
	}

	/**
	 * Updates, renders, and composites the shader-based pollution particles
	 * onto the main canvas.
	 */
	draw() {
		this.update();
		this.render();

		push();
		blendMode(BLEND);
		noTint();

		image(this.layer, 0, 0, width, height);

		pop();
	}
}
