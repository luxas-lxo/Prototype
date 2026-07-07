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
}

function initWorld(){

    WORLD.w = width * 0.6;
    WORLD.h = height * 0.6;
    WORLD.d = max(width,height) * 0.6;

}

function preload() {
  codTable = loadTable(
    "data/fish.csv",
    "csv",
    "header"
  );
}

function generate_swarm(count, cx = 0, cy = 0, cz = 0, rad = 90) {
  fishSwarms.push(new FishSwarm(count, cx, cy, cz, rad));
}

