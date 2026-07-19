function calc_xy(x,y,z){

    let depth = WORLD.d * 1.2;

    let scale = depth/(depth+z);

    return {
        x: width/2 + x*scale,
        y: height/2 + y*scale
    }

}

function calc_scaling(x, y, z) {
  let depth = WORLD.d * 1.2;
  return depth / (depth + z);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    waterTemperatureSurface.resize(width, height);
}

function initWorld(){

    WORLD.w = width * 0.6;
    WORLD.h = height * 0.6;
    WORLD.d = max(width,height) * 0.6;

}

function preload() {
  codTable = loadTable(
    "data/fish2.csv",
    "csv",
    "header"
  );
}

function generate_swarm(count, cx = 0, cy = 0, cz = 0, rad = 90) {
  fishSwarms.push(new FishSwarm(count, cx, cy, cz, rad));
}

function drawCoralLines(coral) {
  const segments = coral.getSegments();

  coralLineLayer.clear();
  coralGlowMaskLayer.clear();

  coralLineLayer.strokeCap(ROUND);
  coralLineLayer.strokeJoin(ROUND);
  coralGlowMaskLayer.strokeCap(ROUND);
  coralGlowMaskLayer.strokeJoin(ROUND);

  for (const segment of segments) {
    const segmentColor = segment.color;
    const visibility = segment.visibility;
    const depthBrightness = lerp(1.0, 0.45, segment.depth);
    const depthAlpha = lerp(1.0, 0.4, segment.depth);
    const redValue = red(segmentColor) * depthBrightness;
    const greenValue = green(segmentColor) * depthBrightness;
    const blueValue = blue(segmentColor) * depthBrightness;

    // Wide colored line used as the glow source
    coralGlowMaskLayer.stroke(redValue, greenValue, blueValue, 90 * visibility * depthAlpha * 0.5);
    coralGlowMaskLayer.strokeWeight(segment.width * 4.5);
    coralGlowMaskLayer.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y);

    // Bright outer line
    coralLineLayer.stroke(255, 255, 255, 75 * visibility * depthAlpha * 0.5);
    coralLineLayer.strokeWeight(segment.width * 2.3);
    coralLineLayer.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y);

    // Colored inner line
    coralLineLayer.stroke(redValue, greenValue, blueValue, 220 * visibility * depthAlpha * 0.5);
    coralLineLayer.strokeWeight(segment.width);
    coralLineLayer.line(segment.start.x, segment.start.y, segment.end.x, segment.end.y);
  }
}

function drawCoralGlow() {
  coralGlowLayer.clear();
  coralGlowLayer.shader(coralGlowShader);

  coralGlowShader.setUniform("u_texture", coralGlowMaskLayer);
  coralGlowShader.setUniform("u_resolution", [width, height]);
  coralGlowShader.setUniform("u_radius", 5.0);
  coralGlowShader.setUniform("u_strength", 0.75);

  coralGlowLayer.noStroke();
  coralGlowLayer.rect(-width / 2, -height / 2, width, height);
}
