import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.117.1/build/three.module.js';


window.focus(); // Capture keys right away (by default focus is on editor)

// Pick a random value from an array
function pickRandom(array) 
{
  return array[Math.floor(Math.random() * array.length)];
}

// The Pythagorean theorem says that the distance between two points is
// the square root of the sum of the horizontal and vertical distance's square
function getDistance(coordinate1, coordinate2) 
{
  const horizontalDistance = coordinate2.x - coordinate1.x;
  const verticalDistance = coordinate2.y - coordinate1.y;
  return Math.sqrt(horizontalDistance ** 2 + verticalDistance ** 2);
}

const vehicleColors = 
[
  0xa52523,
  0xef2d56,
  0x0ad3ff,
  0xff9f1c /*0xa52523, 0xbdb638, 0x78b14b*/
];

const lawnGreen = "#67C240";
const trackColor = "#546E90";
const edgeColor = "#725F48";
const treeCrownColor = 0x498c2c;
const treeTrunkColor = 0x4b3f2f;

const wheelGeometry = new THREE.BoxBufferGeometry(12, 33, 12);
const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
const treeTrunkGeometry = new THREE.BoxBufferGeometry(15, 15, 30);
const treeTrunkMaterial = new THREE.MeshLambertMaterial({  color: treeTrunkColor});

const treeCrownMaterial = new THREE.MeshLambertMaterial({  color: treeCrownColor});

var cameraPos = [0, 50, 350];
var cameraRot = [0, 0, 0];

var move = 1;
var drone = false;
var avatar = false;
// For Hero
var blueMat = new THREE.MeshPhongMaterial({
    color: 0x5b9696,
    shading:THREE.FlatShading,
  });

var brownMat = new THREE.MeshStandardMaterial({
    color: 0x401A07,
    side:THREE.DoubleSide,
    shading:THREE.SmoothShading,
    roughness:1,
  });

const config = 
{
  showHitZones: false,
  shadows: true, // Use shadow
  trees: true, // Add trees to the map
  lamp_posts: true, //Add lamp posts to the map
  curbs: true, // Show texture on the extruded geometry
  grid: false // Show grid helper
};

let score;
const speed = 0.0017;

const playerAngleInitial = Math.PI;
let playerAngleMoved;
let accelerate = false; // Is the player accelerating
let decelerate = false; // Is the player decelerating
let Hit = false;
let followPlayerCar = false;
let HitMesh = "none";
let HumanMount = 0;
let AvatarJump = 0;
let JumpBackThresh = 20;

let otherVehicles = [];
let ready;
let lastTimestamp;

const trackRadius = 225;
const trackWidth = 45;
const innerTrackRadius = trackRadius - trackWidth;
const outerTrackRadius = trackRadius + trackWidth;

const arcAngle1 = (1 / 3) * Math.PI; // 60 degrees

const deltaY = Math.sin(arcAngle1) * innerTrackRadius;
const arcAngle2 = Math.asin(deltaY / outerTrackRadius);

const arcCenterX = (Math.cos(arcAngle1) * innerTrackRadius + Math.cos(arcAngle2) * outerTrackRadius) /2;

const arcAngle3 = Math.acos(arcCenterX / innerTrackRadius);

const arcAngle4 = Math.acos(arcCenterX / outerTrackRadius);

const scoreElement = document.getElementById("score");
const buttonsElement = document.getElementById("buttons");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");
const accelerateButton = document.getElementById("accelerate");
const decelerateButton = document.getElementById("decelerate");

setTimeout(() => 
{
  if (ready) instructionsElement.style.opacity = 1;
  buttonsElement.style.opacity = 1;
}, 4000);

// Initialize ThreeJs
// Set up camera
const aspectRatio = window.innerWidth / window.innerHeight;
const cameraWidth = 960;
const cameraHeight = cameraWidth / aspectRatio;

/*const camera = new THREE.OrthographicCamera
(
  cameraWidth / -2, // left
  cameraWidth / 2, // right
  cameraHeight / 2, // top
  cameraHeight / -2, // bottom
  50, // near plane
  700 // far plane
);

// 0, -210, 300
camera.position.set(0, -210, 300);
camera.lookAt(0, 0, 0);*/

const camera = new THREE.PerspectiveCamera(75, aspectRatio, 2, 1000);
camera.position.set(0, -310, 300);
camera.lookAt(0, 0, 0);
camera.rotation.order = 'YXZ'
//camera.rotation.x = (Math.PI)/2.0;
//console.log(camera)

const avatar_camera = new THREE.PerspectiveCamera(75, aspectRatio, 2, 1000);
//const avatar_camera = new THREE.StereoCamera();
//console.log(avatar_camera.position)
avatar_camera.position.copy(camera.position);
avatar_camera.rotation.x = (Math.PI)/2.0;
//avatar_camera.position.set(0, -310, 100);
//avatar_camera.lookAt(0, 0, 0);
//avatar_camera.rotation.order = 'YXZ'

const scene = new THREE.Scene();

const playerCar = Car();
scene.add(playerCar);

createHeadLightCar(playerCar, -6);
createHeadLightCar(playerCar,  6);


// For Hero
var hero;
var PI = Math.PI;
createHero();

renderMap(cameraWidth, cameraHeight * 2); // The map height is higher because we look at the map from an angle

// Set up lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
// 0.6
// const ambientLight = new THREE.AmbientLight(0xffffff, 0.125);
// scene.add(ambientLight);

// 0.6
// const dirLight = new THREE.DirectionalLight(0xffffff, 0.05);
dirLight.position.set(100, -300, 300);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.left = -400;
dirLight.shadow.camera.right = 350;
dirLight.shadow.camera.top = 400;
dirLight.shadow.camera.bottom = -300;
dirLight.shadow.camera.near = 100;
dirLight.shadow.camera.far = 800;
scene.add(dirLight);

const spotlight = new THREE.SpotLight(0xffffff);
spotlight.position.set(-125, 35, 150);
spotlight.distance = 800;
spotlight.angle = Math.PI/6;
//spotlight.intensity = 0.9;
//var obj = scene.getObjectByName("main");
//spotlight.target = obj;
//console.log(obj);
spotlight.castShadow = true;

spotlight.shadow.mapSize.width = 1024;
spotlight.shadow.mapSize.height = 1024;

spotlight.shadow.camera.near = 500;
spotlight.shadow.camera.far = 4000;
spotlight.shadow.camera.fov = 30;
scene.add(spotlight);

spotlight.target.position.copy(playerCar.position)
scene.add(spotlight.target)
// const cameraHelper = new THREE.CameraHelper(dirLight.shadow.camera);
// scene.add(cameraHelper);

const spotLightHelper = new THREE.SpotLightHelper( spotlight );
scene.add( spotLightHelper );

if (config.grid) 
{
  const gridHelper = new THREE.GridHelper(80, 8);
  gridHelper.rotation.x = Math.PI / 2;
  scene.add(gridHelper);
}

// Set up renderer
const renderer = new THREE.WebGLRenderer({antialias: true, powerPreference: "high-performance"});

renderer.setSize(window.innerWidth, window.innerHeight);

if (config.shadows) renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

reset();

function reset() {
  // Reset position and score
  playerAngleMoved = 0;
  score = 0;
  scoreElement.innerText = "Press UP";

  // Remove other vehicles
  otherVehicles.forEach((vehicle) => {
    // Remove the vehicle from the scene

    if(vehicle.type == "car" || vehicle.type == "truck")
    {
    scene.remove(vehicle.mesh);

    // If it has hit-zone helpers then remove them as well
    if (vehicle.mesh.userData.hitZone1)
      scene.remove(vehicle.mesh.userData.hitZone1);
    if (vehicle.mesh.userData.hitZone2)
      scene.remove(vehicle.mesh.userData.hitZone2);
    if (vehicle.mesh.userData.hitZone3)
      scene.remove(vehicle.mesh.userData.hitZone3);
    }
    });

  otherVehicles = [];

  const type = "human";
  otherVehicles.push({ hero, type});

  resultsElement.style.display = "none";

  lastTimestamp = undefined;
  followPlayerCar = false;

  // Place the player's car to the starting position
  movePlayerCar(0);

  // Render the scene
  renderer.render(scene, camera);

  ready = true;
}

function startGame() 
{
  if (ready) 
  {
    ready = false;
    scoreElement.innerText = 0;
    buttonsElement.style.opacity = 1;
    instructionsElement.style.opacity = 0;
    renderer.setAnimationLoop(animation);
  }
}

function positionScoreElement() 
{
  const arcCenterXinPixels = (arcCenterX / cameraWidth) * window.innerWidth;
  scoreElement.style.cssText = `
    left: ${window.innerWidth / 2 - arcCenterXinPixels * 1.3}px;
    top: ${window.innerHeight / 2}px
  `;
}

function getLineMarkings(mapWidth, mapHeight) 
{
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = trackColor;
  context.fillRect(0, 0, mapWidth, mapHeight);

  context.lineWidth = 2;
  context.strokeStyle = "#E0FFFF";
  context.setLineDash([10, 14]);

  // Left circle
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Right circle
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    trackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

function getCurbsTexture(mapWidth, mapHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = mapWidth;
  canvas.height = mapHeight;
  const context = canvas.getContext("2d");

  context.fillStyle = lawnGreen;
  context.fillRect(0, 0, mapWidth, mapHeight);

  // Extra big
  context.lineWidth = 65;
  context.strokeStyle = "#A2FF75";
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1
  );
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );
  context.stroke();

  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    Math.PI + arcAngle1,
    Math.PI - arcAngle1
  );
  
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    arcAngle2,
    -arcAngle2,
    true
  );
  context.stroke();

  // Extra small
  context.lineWidth = 60;
  context.strokeStyle = lawnGreen;
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1
  );
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );

  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    Math.PI + arcAngle1,
    Math.PI - arcAngle1
  );
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    arcAngle2,
    -arcAngle2,
    true
  );
  context.stroke();

  // Base
  context.lineWidth = 6;
  context.strokeStyle = edgeColor;

  // Outer circle left
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Outer circle right
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    outerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Inner circle left
  context.beginPath();
  context.arc(
    mapWidth / 2 - arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  // Inner circle right
  context.beginPath();
  context.arc(
    mapWidth / 2 + arcCenterX,
    mapHeight / 2,
    innerTrackRadius,
    0,
    Math.PI * 2
  );
  context.stroke();

  return new THREE.CanvasTexture(canvas);
}

function getLeftIsland() 
{
  const islandLeft = new THREE.Shape();

  islandLeft.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle1,
    -arcAngle1,
    false
  );

  islandLeft.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI + arcAngle2,
    Math.PI - arcAngle2,
    true
  );

  return islandLeft;
}

function getMiddleIsland() 
{
  const islandMiddle = new THREE.Shape();

  islandMiddle.absarc(
    -arcCenterX,
    0,
    innerTrackRadius,
    arcAngle3,
    -arcAngle3,
    true
  );

  islandMiddle.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI + arcAngle3,
    Math.PI - arcAngle3,
    true
  );

  return islandMiddle;
}

function getRightIsland() 
{
  const islandRight = new THREE.Shape();

  islandRight.absarc(
    arcCenterX,
    0,
    innerTrackRadius,
    Math.PI - arcAngle1,
    Math.PI + arcAngle1,
    true
  );

  islandRight.absarc(
    -arcCenterX,
    0,
    outerTrackRadius,
    -arcAngle2,
    arcAngle2,
    false
  );

  return islandRight;
}

function getOuterField(mapWidth, mapHeight) 
{
  const field = new THREE.Shape();

  field.moveTo(-mapWidth / 2, -mapHeight / 2);
  field.lineTo(0, -mapHeight / 2);

  field.absarc(-arcCenterX, 0, outerTrackRadius, -arcAngle4, arcAngle4, true);

  field.absarc(
    arcCenterX,
    0,
    outerTrackRadius,
    Math.PI - arcAngle4,
    Math.PI + arcAngle4,
    true
  );

  field.lineTo(0, -mapHeight / 2);
  field.lineTo(mapWidth / 2, -mapHeight / 2);
  field.lineTo(mapWidth / 2, mapHeight / 2);
  field.lineTo(-mapWidth / 2, mapHeight / 2);

  return field;
}

function renderMap(mapWidth, mapHeight) 
{
  const lineMarkingsTexture = getLineMarkings(mapWidth, mapHeight);

  const planeGeometry = new THREE.PlaneBufferGeometry(mapWidth, mapHeight);
  const planeMaterial = new THREE.MeshLambertMaterial({
    map: lineMarkingsTexture
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.receiveShadow = true;
  plane.matrixAutoUpdate = false;
  scene.add(plane);

  // Extruded geometry with curbs
  const islandLeft = getLeftIsland();
  const islandMiddle = getMiddleIsland();
  const islandRight = getRightIsland();
  const outerField = getOuterField(mapWidth, mapHeight);

  // Mapping a texture on an extruded geometry works differently than mapping it to a box
  // By default it is mapped to a 1x1 unit square, and we have to stretch it out by setting repeat
  // We also need to shift it by setting the offset to have it centered
  const curbsTexture = getCurbsTexture(mapWidth, mapHeight);
  curbsTexture.offset = new THREE.Vector2(0.5, 0.5);
  curbsTexture.repeat.set(1 / mapWidth, 1 / mapHeight);

  // An extruded geometry turns a 2D shape into 3D by giving it a depth
  const fieldGeometry = new THREE.ExtrudeBufferGeometry(
    [islandLeft, islandRight, islandMiddle, outerField],
    { depth: 6, bevelEnabled: false }
  );

  const fieldMesh = new THREE.Mesh(fieldGeometry, [
    new THREE.MeshLambertMaterial({
      // Either set a plain color or a texture depending on config
      color: !config.curbs && lawnGreen,
      map: config.curbs && curbsTexture
    }),
    new THREE.MeshLambertMaterial({ color: 0x23311c })
  ]);
  fieldMesh.receiveShadow = true;
  fieldMesh.matrixAutoUpdate = false;
  scene.add(fieldMesh);

  positionScoreElement();

  if (config.trees) {
    const tree1 = Tree();
    tree1.position.x = arcCenterX * 1.3;
    scene.add(tree1);

    const tree2 = Tree();
    tree2.position.y = arcCenterX * 1.9;
    tree2.position.x = arcCenterX * 1.3;
    scene.add(tree2);

    const tree3 = Tree();
    tree3.position.x = arcCenterX * 0.8;
    tree3.position.y = arcCenterX * 2;
    scene.add(tree3);

    const tree4 = Tree();
    tree4.position.x = arcCenterX * 1.8;
    tree4.position.y = arcCenterX * 2;
    scene.add(tree4);

    const tree5 = Tree();
    tree5.position.x = -arcCenterX * 1;
    tree5.position.y = arcCenterX * 2;
    scene.add(tree5);

    const tree6 = Tree();
    tree6.position.x = -arcCenterX * 2;
    tree6.position.y = arcCenterX * 1.8;
    scene.add(tree6);

    const tree7 = Tree();
    tree7.position.x = arcCenterX * 0.8;
    tree7.position.y = -arcCenterX * 2;
    scene.add(tree7);

    const tree8 = Tree();
    tree8.position.x = arcCenterX * 1.8;
    tree8.position.y = -arcCenterX * 2;
    scene.add(tree8);

    const tree9 = Tree();
    tree9.position.x = -arcCenterX * 1;
    tree9.position.y = -arcCenterX * 2;
    scene.add(tree9);

    const tree10 = Tree();
    tree10.position.x = -arcCenterX * 2;
    tree10.position.y = -arcCenterX * 1.8;
    scene.add(tree10);

    const tree11 = Tree();
    tree11.position.x = arcCenterX * 0.6;
    tree11.position.y = -arcCenterX * 2.3;
    scene.add(tree11);

    const tree12 = Tree();
    tree12.position.x = arcCenterX * 1.5;
    tree12.position.y = -arcCenterX * 2.4;
    scene.add(tree12);

    const tree13 = Tree();
    tree13.position.x = -arcCenterX * 0.7;
    tree13.position.y = -arcCenterX * 2.4;
    scene.add(tree13);

    const tree14 = Tree();
    tree14.position.x = -arcCenterX * 1.5;
    tree14.position.y = -arcCenterX * 1.8;
    scene.add(tree14);
  }

  if (config.lamp_posts) {
    const lp1 = LampPost(arcCenterX, 0, 0xfcf787);
    lp1.position.x = arcCenterX;
    scene.add(lp1);

    const lp2 = LampPost(-arcCenterX, 0, 0xfcf787);
    lp2.position.x = -arcCenterX;
    scene.add(lp2);

    const lp3 = LampPost(0, -1, 0xfcf787);
    lp3.position.x = 0;
    lp3.position.y = -1;
    scene.add(lp3);
  }
}

function getCarFrontTexture() 
{
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 64, 32);

  context.fillStyle = "#666666";
  context.fillRect(8, 8, 48, 24);

  return new THREE.CanvasTexture(canvas);
}

function getCarSideTexture() 
{
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 128, 32);

  context.fillStyle = "#666666";
  context.fillRect(10, 8, 38, 24);
  context.fillRect(58, 8, 60, 24);

  return new THREE.CanvasTexture(canvas);
}

function Car() 
{
  const car = new THREE.Group();

  const color = pickRandom(vehicleColors);

  const main = new THREE.Mesh(
    new THREE.BoxBufferGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ color })
  );
  main.name = "main";
  
  // createHeadLight(main, -10);
  // createHeadLight(main,  10);

  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  car.add(main);

  const carFrontTexture = getCarFrontTexture();
  carFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  carFrontTexture.rotation = Math.PI / 2;

  const carBackTexture = getCarFrontTexture();
  carBackTexture.center = new THREE.Vector2(0.5, 0.5);
  carBackTexture.rotation = -Math.PI / 2;

  const carLeftSideTexture = getCarSideTexture();
  carLeftSideTexture.flipY = false;

  const carRightSideTexture = getCarSideTexture();

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(33, 24, 12), [
    new THREE.MeshLambertMaterial({ map: carFrontTexture }),
    new THREE.MeshLambertMaterial({ map: carBackTexture }),
    new THREE.MeshLambertMaterial({ map: carLeftSideTexture }),
    new THREE.MeshLambertMaterial({ map: carRightSideTexture }),
    new THREE.MeshLambertMaterial({ color: 0xffffff }), // top
    new THREE.MeshLambertMaterial({ color: 0xffffff }) // bottom
  ]);
  cabin.position.x = -6;
  cabin.position.z = 25.5;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  car.add(cabin);

  const backWheel = new Wheel();
  backWheel.position.x = -18;
  car.add(backWheel);

  const frontWheel = new Wheel();
  frontWheel.position.x = 18;
  car.add(frontWheel);

  if (config.showHitZones) {
    car.userData.hitZone1 = HitZone();
    car.userData.hitZone2 = HitZone();
  }

 

  return car;
}

function getTruckFrontTexture() 
{
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 32, 32);

  context.fillStyle = "#666666";
  context.fillRect(0, 5, 32, 10);

  return new THREE.CanvasTexture(canvas);
}

function getTruckSideTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, 32, 32);

  context.fillStyle = "#666666";
  context.fillRect(17, 5, 15, 10);

  return new THREE.CanvasTexture(canvas);
}

function Truck() 
{
  const truck = new THREE.Group();
  const color = pickRandom(vehicleColors);

  const base = new THREE.Mesh(
    new THREE.BoxBufferGeometry(100, 25, 5),
    new THREE.MeshLambertMaterial({ color: 0xb4c6fc })
  );
  base.position.z = 10;
  truck.add(base);

  const cargo = new THREE.Mesh(
    new THREE.BoxBufferGeometry(75, 35, 40),
    new THREE.MeshLambertMaterial({ color: 0xffffff }) // 0xb4c6fc
  );
  cargo.position.x = -15;
  cargo.position.z = 30;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  truck.add(cargo);

  const truckFrontTexture = getTruckFrontTexture();
  truckFrontTexture.center = new THREE.Vector2(0.5, 0.5);
  truckFrontTexture.rotation = Math.PI / 2;

  const truckLeftTexture = getTruckSideTexture();
  truckLeftTexture.flipY = false;

  const truckRightTexture = getTruckSideTexture();

  const cabin = new THREE.Mesh(new THREE.BoxBufferGeometry(25, 30, 30), [
    new THREE.MeshLambertMaterial({ color, map: truckFrontTexture }),
    new THREE.MeshLambertMaterial({ color }), // back
    new THREE.MeshLambertMaterial({ color, map: truckLeftTexture }),
    new THREE.MeshLambertMaterial({ color, map: truckRightTexture }),
    new THREE.MeshLambertMaterial({ color }), // top
    new THREE.MeshLambertMaterial({ color }) // bottom
  ]);
  cabin.position.x = 40;
  cabin.position.z = 20;
  cabin.castShadow = true;
  cabin.receiveShadow = true;
  truck.add(cabin);

  const backWheel = Wheel();
  backWheel.position.x = -30;
  truck.add(backWheel);

  const middleWheel = Wheel();
  middleWheel.position.x = 10;
  truck.add(middleWheel);

  const frontWheel = Wheel();
  frontWheel.position.x = 38;
  truck.add(frontWheel);

  if (config.showHitZones) {
    truck.userData.hitZone1 = HitZone();
    truck.userData.hitZone2 = HitZone();
    truck.userData.hitZone3 = HitZone();
  }

  return truck;
}

function HitZone() 
{
  const hitZone = new THREE.Mesh(
    new THREE.CylinderGeometry(20, 20, 60, 30),
    new THREE.MeshLambertMaterial({ color: 0xff0000 })
  );
  hitZone.position.z = 25;
  hitZone.rotation.x = Math.PI / 2;

  scene.add(hitZone);
  return hitZone;
}

function Wheel() 
{
  const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheel.position.z = 6;
  wheel.castShadow = false;
  wheel.receiveShadow = false;
  return wheel;
}

function Tree() 
{
  const tree = new THREE.Group();

  const treeHeights = [45, 60, 75];
  const height = pickRandom(treeHeights);

  const trunk = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, height + 30), treeTrunkMaterial);
  trunk.position.z = height;
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  trunk.matrixAutoUpdate = false;
  tree.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.SphereGeometry(height / 2, 30, 30),
    treeCrownMaterial
  );
  crown.position.z = height / 2 + 30;
  crown.castShadow = true;
  crown.receiveShadow = false;
  tree.add(crown);

  return tree;
}

function LampPost(x, y, color)
{
  const lamp_post = new THREE.Group();

  const lamp = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 15), new THREE.MeshPhongMaterial({color: color, opacity: 0.9, transparent: true, side: THREE.DoubleSide,}))
  lamp.position.z = 60;
  lamp.castShadow = true;
  lamp.receiveShadow = false;
  lamp.matrixAutoUpdate = true;
  lamp_post.add(lamp);

  const post = new THREE.Mesh(new THREE.BoxBufferGeometry(5, 5, 50), new THREE.MeshLambertMaterial({color: 0x624003}))
  post.position.z = 25;
  post.castShadow = true;
  post.receiveShadow = true;
  post.matrixAutoUpdate = true;
  lamp_post.add(post);

  const light = new THREE.PointLight(color, 1);
  light.position.set(x, y, 60);
  lamp_post.add(light);

  return lamp_post;
}

function LampPost2(x, y, color)
{
  const lamp_post = new THREE.Group();

  const lamp = new THREE.Mesh(new THREE.BoxBufferGeometry(10, 10, 15), new THREE.MeshPhongMaterial({color: color, opacity: 0.9, transparent: true, side: THREE.DoubleSide,}))
  lamp.position.z = 60;
  lamp.castShadow = true;
  lamp.receiveShadow = false;
  lamp.matrixAutoUpdate = true;
  lamp_post.add(lamp);

  const post = new THREE.Mesh(new THREE.BoxBufferGeometry(5, 5, 10), new THREE.MeshLambertMaterial({color: 0x624003}))
  post.position.z = 25;
  post.castShadow = true;
  post.receiveShadow = true;
  post.matrixAutoUpdate = true;
  lamp_post.add(post);

  const light1 = new THREE.SpotLight(color, 0.5);
  light1.target.position.set(x-50, y, 60);
  light1.castShadow = true;
  light1.position.set(x, y, 60);
  lamp_post.add(light1);

  const light2 = new THREE.SpotLight(color, 0.5);
  light2.target.position.set(x+50, y, 60);
  light2.castShadow = true;
  light2.position.set(x, y, 60);
  lamp_post.add(light2);

  const light3 = new THREE.SpotLight(color, 0.5);
  light3.target.position.set(x, y-50, 60);
  light3.castShadow = true;
  light3.position.set(x, y, 60);
  lamp_post.add(light3);

  const light4 = new THREE.SpotLight(color, 0.5);
  light4.target.position.set(x, y+50, 60);
  light4.castShadow = true;
  light4.position.set(x, y, 60);
  lamp_post.add(light4);

  return lamp_post;
}

function Hero() 
{
  this.runningCycle = 0;
  this.runningState = "w";
  this.mesh = new THREE.Group();
  this.body = new THREE.Group();
  this.mesh.add(this.body);

  this.mesh.position.z = 10;
  this.mesh.position.x = 10;

  
  var torsoGeom = new THREE.CubeGeometry(8,8,8, 1);//
  this.torso = new THREE.Mesh(torsoGeom, blueMat);
  this.torso.position.z = 8;
  this.torso.castShadow = true;
  this.body.add(this.torso);
  
  var handGeom = new THREE.CubeGeometry(3,3,3, 1);
  this.handR = new THREE.Mesh(handGeom, brownMat);
  this.handR.position.x=7;
  this.handR.position.z=8;
  this.body.add(this.handR);
  
  this.handL = this.handR.clone();
  this.handL.position.x = - this.handR.position.x;
  this.body.add(this.handL);
  
  var headGeom = new THREE.CubeGeometry(16,16,16, 1);//
  this.head = new THREE.Mesh(headGeom, blueMat);
  this.head.position.z = 21;
  this.head.castShadow = true;
  this.body.add(this.head);
  
  var legGeom = new THREE.CubeGeometry(8,3,5, 1);
  
  this.legR = new THREE.Mesh(legGeom, brownMat);
  // 
  this.legR.position.y = 0;
  this.legR.position.x = 7;
  this.legR.position.z = 0;
  this.legR.castShadow = true;
  this.body.add(this.legR);
  
  this.legL = this.legR.clone();
  this.legL.position.x = - this.legR.position.x;
  this.legL.castShadow = true;
  this.body.add(this.legL);

  if (config.showHitZones) 
  {
    this.mesh.userData.hitZone1 = HitZone();
  }

  this.body.traverse(function(object) {
    if (object instanceof THREE.Mesh) 
    {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });
}

Hero.prototype.run = function()
{
  // this.runningCycle += 0.03;
  var t = this.runningCycle;
  t = t * 8;
  t = t % (2*PI);
  var amp = 4;
  
  if(hero.runningState == "w" || hero.runningState == "s" )
  {
      this.legR.position.y =  Math.cos(t) * amp;
      this.legR.position.z = Math.max (0, - Math.sin(t) * amp);  
      
      this.legL.position.y =  Math.cos(t + PI) * amp;
      this.legL.position.z = Math.max (0, - Math.sin(t + PI) * amp);
      
      if (t>PI)
      {
        this.legR.rotation.x = Math.cos(t * 2 + PI/2) * PI/4; 
        this.legL.rotation.x = 0; 
      } 
      else
      {
        this.legR.rotation.x = 0; 
        this.legL.rotation.x = Math.cos(t * 2 + PI/2) *  PI/4;  
      }

      this.torso.position.z = 8 - Math.cos(  t * 2 ) * amp * .2;
      this.torso.rotation.z = -Math.cos( t + PI ) * amp * .05;
      
      this.head.position.z = 21 - Math.cos(  t * 2 ) * amp * .3;
      this.head.rotation.y = Math.cos( t ) * amp * .02;
      this.head.rotation.z =  Math.cos( t ) * amp * .01;

      this.handR.position.y = -Math.cos( t ) * amp;
      this.handR.rotation.x = -Math.cos( t ) * PI/8;
      this.handL.position.y = -Math.cos( t + PI) * amp;
      this.handL.rotation.x = -Math.cos( t + PI) * PI/8;
  }

  if(hero.runningState == "a" || hero.runningState == "d" )
  {
      this.legR.position.x =  Math.cos(t) * amp;
      this.legR.position.z = Math.max (0, - Math.sin(t) * amp);  
      
      this.legL.position.x =  Math.cos(t + PI) * amp;
      this.legL.position.z = Math.max (0, - Math.sin(t + PI) * amp);
      
      if (t>PI)
      {
        this.legR.rotation.y = Math.cos(t * 2 + PI/2) * PI/4; 
        this.legL.rotation.y = 0; 
      } 
      else
      {
        this.legR.rotation.y = 0; 
        this.legL.rotation.y = Math.cos(t * 2 + PI/2) *  PI/4;  
      }

      this.torso.position.z = 8 - Math.cos(  t * 2 ) * amp * .2;
      this.torso.rotation.z = -Math.cos( t + PI ) * amp * .05;
      
      this.head.position.z = 21 - Math.cos(  t * 2 ) * amp * .3;
      this.head.rotation.x = Math.cos( t ) * amp * .02;
      this.head.rotation.z =  Math.cos( t ) * amp * .01;

      this.handR.position.x = -Math.cos( t ) * amp;
      this.handR.rotation.y = -Math.cos( t ) * PI/8;
      this.handL.position.x = -Math.cos( t + PI) * amp;
      this.handL.rotation.y = -Math.cos( t + PI) * PI/8;
  }
}

function createHero() 
{
  hero = new Hero();
  const type = "human";


  // hero.mesh.position.y=-15;
  scene.add(hero.mesh);

  otherVehicles.push({ hero, type});
  // console.log(otherVehicles);
}

accelerateButton.addEventListener("mousedown", function () {
  startGame();
  accelerate = true;
});

decelerateButton.addEventListener("mousedown", function () {
  startGame();
  decelerate = true;
});

accelerateButton.addEventListener("mouseup", function () {
  accelerate = false;
});

decelerateButton.addEventListener("mouseup", function () {
  decelerate = false;
});

window.addEventListener("keydown", function (event) {
  if (event.key == "ArrowUp") {
    startGame();
    accelerate = true;
    return;
  }

  if (event.key == "w") {
    startGame();
    // accelerate = true;
    return;
  }

  if (event.key == "ArrowDown") {
    decelerate = true;
    return;
  }
  if (event.key == "R" || event.key == "r") {
    //reset();
    return;
  }
  if (event.key == "F" || event.key == "f"){
    followPlayerCar = !followPlayerCar;
    return;
  }
});

window.addEventListener("keyup", function (event) 
{
  if (event.key == "ArrowUp") 
  {
    accelerate = false;
    return;
  }
  
  if (event.key == "ArrowDown") 
  {
    decelerate = false;
    return;
  }

  // if (event.key == "w")
  // {
  //   console.log("Pressed W");
  //   hero.runningCycle += 0.03;
  //   return;
  // }


});

window.addEventListener("keydown", function (event) {

  if (event.key == "w")
  {
    // console.log("Pressed W");
    avatar_camera.rotation.y = 0;
    switch(hero.runningState)
    {
      case "w": hero.mesh.rotation.z = 0;
      //avatar_camera.rotation.y = 0;
      break;

      case "a": hero.mesh.rotation.z = -Math.PI/2;
      //avatar_camera.rotation.y = -Math.PI/2;
      break;

      case "s": hero.mesh.rotation.z = -Math.PI;
      //avatar_camera.rotation.y = -Math.PI;
      break;

      case "d": hero.mesh.rotation.z = Math.PI/2;
      //avatar_camera.rotation.y = Math.PI/2;
      break;
    }

    hero.runningCycle += 0.03;
    
    if(HumanMount)
    {
      hero.mesh.position.y = playerCar.position.y;
    }
    
    hero.mesh.translateY(1);
    // hero.mesh.position.y += 0.4;

    hero.runningState = "w"; 
    return;
  }

  if (event.key == "s")
  {
    // console.log("Pressed S");
    avatar_camera.rotation.y = -Math.PI
    switch(hero.runningState)
    {
      case "w": hero.mesh.rotation.z = -Math.PI;
      //avatar_camera.rotation.y = -Math.PI;
      break;

      case "a": hero.mesh.rotation.z = Math.PI/2;
     // avatar_camera.rotation.y = Math.PI/2;
      break;

      case "s": hero.mesh.rotation.z = 0;
     // avatar_camera.rotation.y = 0;
      break;

      case "d": hero.mesh.rotation.z = -Math.PI/2;
      //avatar_camera.rotation.y = -Math.PI/2;
      break;
    }

    hero.runningCycle -= 0.03;
    
    if(HumanMount)
    {
      hero.mesh.position.y = playerCar.position.y;
    }
    
    hero.mesh.translateY(-1);
    // hero.mesh.position.y -= 0.4;
    
    hero.runningState = "s"; 
    return;

    // hero.runningCycle -= 0.03;
    // hero.mesh.rotation.z = -Math.PI/2 
    // hero.mesh.position.y -= 0.2;
    // return;
  }

  if (event.key == "a")
  {
    // console.log("Pressed W");
    avatar_camera.rotation.y = Math.PI/2;
    switch(hero.runningState)
    {
      case "w": hero.mesh.rotation.z = Math.PI/2;
      //avatar_camera.rotation.y = Math.PI/2;
      break;

      case "a": hero.mesh.rotation.z = 0;
      //avatar_camera.rotation.y = 0;
      break;

      case "s": hero.mesh.rotation.z = -Math.PI/2;
      //avatar_camera.rotation.y = -Math.PI/2;
      break;

      case "d": hero.mesh.rotation.z = -Math.PI;
      //avatar_camera.rotation.y = -Math.PI;
      break;
    }

    hero.runningCycle -= 0.03;
    
    if(HumanMount)
    {
      hero.mesh.position.x = playerCar.position.x;
    }
    
    hero.mesh.translateX(-1);
    // hero.mesh.position.x -= 0.4;
    
    hero.runningState = "a"; 
    return;
  }
  
  if (event.key == "d")
  {
    // console.log("Pressed W");
    avatar_camera.rotation.y = -Math.PI/2;
    switch(hero.runningState)
    {
      case "w": hero.mesh.rotation.z = -Math.PI/2;
      //avatar_camera.rotation.y = -Math.PI/2;
      //console.log(avatar_camera.rotation)
      break;

      case "a": hero.mesh.rotation.z = -Math.PI;
      //avatar_camera.rotation.y = -Math.PI;
      //console.log(avatar_camera.rotation)
      break;

      case "s": hero.mesh.rotation.z = Math.PI/2;
      //avatar_camera.rotation.y = Math.PI/2;
      //console.log(avatar_camera.rotation)
      break;

      case "d": hero.mesh.rotation.z = 0;
      //avatar_camera.rotation.y = 0;
      //console.log(avatar_camera.rotation)
      break;
    }

    hero.runningCycle += 0.03;
    
    if(HumanMount)
    {
      hero.mesh.position.x = playerCar.position.x;
    }
    
    hero.mesh.translateX(1);
    // hero.mesh.position.x += 0.4;


    hero.runningState = "d"; 
    return;
  }

});

window.addEventListener("keyup", function(event)
{
  // console.log(event.code);
  if(event.code=="KeyC")
  {
    //camera.position.z = 350;
    //camera.position.y = 50;
    //camera.position.x = 0;
    drone = true;
    avatar = false;
    camera.position.set(cameraPos[0],cameraPos[1],cameraPos[2]);
    camera.rotation.set(cameraRot[0],cameraRot[1],cameraRot[2]);

    //camera.rotation.y = 0;
    //camera.rotation.x = 0;
    //camera.rotation.z = 0;
    camera.updateProjectionMatrix();
    startGame();
  }
  else if(event.code=="KeyR")
  {
    drone = false;
    avatar = false;
    camera.position.z = 100;
    camera.position.y = -310;
    camera.position.x = 0;
    //console.log(camera.rotation);
    camera.rotation.z = 0;
    camera.rotation.x = 1.2587542052323633;
    camera.rotation.y = 0;
    camera.updateProjectionMatrix();
    startGame();
  }
  else if(event.code=="KeyQ")
  {
    avatar = true;
  }
  if(drone==true)
  {
    if(event.code=="ArrowUp")
    {
      cameraPos[1]+=move;
    }
    else if(event.code=="ArrowDown")
    {
      cameraPos[1]-=move;
    }
    else if(event.code=="ArrowLeft")
    {
      cameraPos[0]-=move;
    }
    else if(event.code=="ArrowRight")
    {
      cameraPos[0]+=move;
    }
    else if(event.code=="KeyI")
    {
      cameraPos[2]-=move;
    }
    else if(event.code=="KeyO")
    {
      cameraPos[2]+=move;
    }
    else if(event.code=="NumpadAdd")
    {
      move+=0.5;
      move = Math.min(move, 10.0);
    }
    else if(event.code=="NumpadSubtract")
    {
      move-=0.5;
      move = Math.max(move, 1.0);
    }
    camera.position.set(cameraPos[0],cameraPos[1],cameraPos[2]);
    camera.updateProjectionMatrix();
    startGame();
  }
  
  if(event.key == "m")
  {
    if(Hit == true && HitMesh == "human")
    {
      hero.mesh.position.x = playerCar.position.x;
      hero.mesh.position.y = playerCar.position.y;
      hero.mesh.position.z = 25;
      Hit = false;
      HumanMount = 1;
    }
  }

  if(event.key == "u")
  {
      hero.mesh.position.x = playerCar.position.x + 50;
      hero.mesh.position.y = playerCar.position.y;
      hero.mesh.position.z = 20;
      Hit = false;
      HumanMount = 0;
    
  }

  if(event.code == "Space")
  {
    AvatarJump = 1;
  }

});

var rot = -1;
function animation(timestamp) 
{
  if (!lastTimestamp) 
  {
    lastTimestamp = timestamp;
    return;
  }

  const timeDelta = timestamp - lastTimestamp;

  movePlayerCar(timeDelta);

  if(HumanMount)
  {
    hero.mesh.position.x = playerCar.position.x;
    hero.mesh.position.y = playerCar.position.y;
    
    if(AvatarJump === 0)
    {
      hero.mesh.position.z = 25;
    }

    JumpBackThresh = 25;
  }
  
  

  if(AvatarJump === 1)
  {
    // hero.mesh.position.z = 100;
    while(Math.floor(hero.mesh.position.z) != 50)
    {
      hero.mesh.position.z += 1.5;
      break;
    }
    
    if(Math.floor(hero.mesh.position.z) == 50)
    {
      AvatarJump = -1;
    }  
  }

  else if(AvatarJump === -1)
  {
    // hero.mesh.position.z = 20;
    
    while(Math.floor(hero.mesh.position.z) != JumpBackThresh)
    {
      // console.log("Jump Back Down, ", hero.mesh.position.z);
      hero.mesh.position.z -= 1.5;
      break;
    }
    
    if(Math.floor(hero.mesh.position.z) < JumpBackThresh)
    {
      hero.mesh.position.z = JumpBackThresh;
      AvatarJump = 0;
    }
    
    // AvatarJump = 0;  
  }

  // For hero
  hero.run();
  // rot+=.01;
  // hero.mesh.rotation.z = -Math.PI/2 
  // + Math.sin(rot * Math.PI/8);

  const laps = Math.floor(Math.abs(playerAngleMoved) / (Math.PI * 2));

  // Update score if it changed
  if (laps != score) {
    score = laps;
    scoreElement.innerText = score;
  }

  // Add a new vehicle at the beginning and with every 5th lap
  if (otherVehicles.length < (laps + 1) / 2) 
  {
    if(otherVehicles.length < 4)
    {
      addVehicle(otherVehicles.length);
      console.log("Length of other vehicles");
      console.log(otherVehicles.length);
    }

  }

  moveOtherVehicles(timeDelta);

  Hit = hitDetection()[0];
  HitMesh = hitDetection()[1];

  // console.log("Hit Tuple :", Hit[1]);

  spotlight.target.position.copy(playerCar.position)
  spotlight.target.updateMatrixWorld();
  spotLightHelper.update();

  if(avatar==true){
    //console.log(hero.position);
    avatar_camera.position.copy(hero.mesh.position);
    var dir = new THREE.Vector3( 0, 0, 20 );
    avatar_camera.position.add(dir)
    //avatar_camera.rotation.copy(hero.mesh.rotation);
    //console.log(avatar_camera.rotation)
    //avatar_camera.rotation.x = (Math.PI)/2.0;
    //console.log(hero.mesh.quaternion);
    renderer.render(scene, avatar_camera);  
  }
  else{
    renderer.render(scene, camera);
  }
  lastTimestamp = timestamp;
}

function movePlayerCar(timeDelta) 
{
  const playerSpeed = getPlayerSpeed();
  playerAngleMoved -= playerSpeed * timeDelta;

  let totalPlayerAngle = playerAngleInitial + playerAngleMoved;
  if (totalPlayerAngle < -Math.PI) {
    totalPlayerAngle += 2 * Math.PI;
  }

  const playerX = Math.cos(totalPlayerAngle) * trackRadius - arcCenterX;
  const playerY = Math.sin(totalPlayerAngle) * trackRadius;

  playerCar.position.x = playerX;
  playerCar.position.y = playerY;

  playerCar.rotation.z = totalPlayerAngle - Math.PI / 2;
}

function moveOtherVehicles(timeDelta) 
{
  otherVehicles.forEach((vehicle) => 
  {
    if(vehicle.type != "human")
    {
      if (vehicle.following && followPlayerCar){
        vehicle.speed = getPlayerSpeed();
        vehicle.angle -= timeDelta * vehicle.speed;
        vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
        vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
        vehicle.mesh.rotation.z = vehicle.angle - Math.PI / 2;
        return;
      }

      if (vehicle.clockwise) 
      {
        vehicle.angle -= speed * timeDelta * vehicle.speed;
        if (vehicle.angle < -Math.PI) {
          vehicle.angle += 2 * Math.PI;
        }      
        if (followPlayerCar && vehicle.angle <= - Math.PI + arcAngle4 && !Hit){
          if (playerCar.rotation.z + Math.PI / 2 < -arcAngle1 - 1.0 * vehicle.number){
            vehicle.angle = playerCar.rotation.z + Math.PI/2 + 1.0 * vehicle.number;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.speed = getPlayerSpeed();
            vehicle.following = true;
            return;
          } else { return; }
        } else if (!followPlayerCar && vehicle.following) {
          if (vehicle.angle < arcAngle1){
            vehicle.angle = Math.PI - arcAngle4;
            vehicle.speed = 1;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.mesh.rotation.z = vehicle.angle - Math.PI / 2;
            vehicle.following = false;
            return;
          } else { 
            vehicle.speed = getPlayerSpeed();
            vehicle.angle -= timeDelta * vehicle.speed;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.mesh.rotation.z = vehicle.angle - Math.PI / 2;
            return;
          }
        } else {
          vehicle.angle -= speed * timeDelta * vehicle.speed;
          const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
          const vehicleY = Math.sin(vehicle.angle) * trackRadius;
          const rotation = vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
          vehicle.mesh.position.x = vehicleX;
          vehicle.mesh.position.y = vehicleY;
          vehicle.mesh.rotation.z = rotation;
          return;
        }
      }
      else 
      {
        
        vehicle.angle += speed * timeDelta * vehicle.speed;
        if (vehicle.angle > Math.PI) {
          vehicle.angle -= 2 * Math.PI;
        }  
        if (followPlayerCar && vehicle.angle <= Math.PI - arcAngle4 && !Hit){
          if (playerCar.rotation.z + Math.PI / 2 < arcAngle1 - 1.0 * vehicle.number){
            vehicle.angle = playerCar.rotation.z + Math.PI/2 + 1.0 * vehicle.number;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.speed = getPlayerSpeed();
            vehicle.following = true;
            return;
          } else { return; }
        } else if (!followPlayerCar && vehicle.following) {
          if (vehicle.angle < -arcAngle1){
            vehicle.angle = -Math.PI + arcAngle4;
            vehicle.speed = 1;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.mesh.rotation.z = vehicle.angle + Math.PI / 2;
            vehicle.following = false;
            return;
          } else { 
            vehicle.speed = getPlayerSpeed();
            vehicle.angle -= timeDelta * vehicle.speed;
            vehicle.mesh.position.x = Math.cos(vehicle.angle) * trackRadius - arcCenterX;
            vehicle.mesh.position.y = Math.sin(vehicle.angle) * trackRadius;
            vehicle.mesh.rotation.z = vehicle.angle - Math.PI / 2;
            return;
          }
        } else {
          vehicle.angle += speed * timeDelta * vehicle.speed;
          const vehicleX = Math.cos(vehicle.angle) * trackRadius + arcCenterX;
          const vehicleY = Math.sin(vehicle.angle) * trackRadius;
          const rotation = vehicle.angle + (vehicle.clockwise ? -Math.PI / 2 : Math.PI / 2);
          vehicle.mesh.position.x = vehicleX;
          vehicle.mesh.position.y = vehicleY;
          vehicle.mesh.rotation.z = rotation;
          return;
        }

      }
      }
  });
}

function getPlayerSpeed() 
{
  if (accelerate) return speed * 2;
  if (decelerate) return speed * 0.5;
  if ((Hit && HitMesh == "human" && HumanMount == 0) || ((Hit && HitMesh == "car") || (Hit && HitMesh == "truck"))) return speed * 0;
  return speed;
}

function addVehicle(number) 
{
  const vehicleTypes = ["car", "truck"];

  const type = pickRandom(vehicleTypes);
  const speed = getVehicleSpeed(type);
  const clockwise = Math.random() >= 0.5;

  const angle = clockwise ? Math.PI / 2 : -Math.PI / 2;
  const following = false;

  const mesh = type == "car" ? Car() : Truck();
  scene.add(mesh);

  // HeadLights?
  if(type == "car")
  {
    createHeadLightCar(mesh, -5);
    createHeadLightCar(mesh,  5);
  }

  if(type == "truck")
  {
    createHeadLightTruck(mesh, -5);
    createHeadLightTruck(mesh,  5);
  }

  otherVehicles.push({ mesh, type, speed, clockwise, angle, following, number});
}

function getVehicleSpeed(type) 
{
  if (type == "car") 
  {
    const minimumSpeed = 1;
    const maximumSpeed = 2;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  }
  
  if (type == "truck") 
  {
    const minimumSpeed = 0.6;
    const maximumSpeed = 1.5;
    return minimumSpeed + Math.random() * (maximumSpeed - minimumSpeed);
  }
}

function getHitZonePosition(center, angle, clockwise, distance) 
{
  const directionAngle = angle + clockwise ? -Math.PI / 2  : +Math.PI / 2;
  return {
    x: center.x + Math.cos(directionAngle) * distance,
    y: center.y + Math.sin(directionAngle) * distance
  };
}

function getHitZonePositionAvatar(center) 
{
  return {
    x: center.x,
    y: center.y 
  };
}

function createHeadLightCar(base, shift) 
{
  let bulb = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshBasicMaterial());
  bulb.scale.setScalar(3);
  bulb.position.set(32, shift, 14);
  base.add(bulb);
  // scene.add(bulb);

  let light = new THREE.SpotLight(0xffffff, 2, 1000, (THREE.Math.degToRad(40)), 0.15);
    // , 100, THREE.Math.degToRad(15));
  // , -50, 80, THREE.Math.degToRad(10), 30);
  light.position.set(32, shift, 14);
  base.add(light);
  // scene.add(light);

  let lightTarget = new THREE.Object3D();
  lightTarget.position.set(32 + 0.1, (shift), 13.95);
  base.add(lightTarget);
  // scene.add(lightTarget);

  // console.log(base);
  
  light.target = lightTarget;
}

function createHeadLightTruck(base, shift) 
{
  let bulb = new THREE.Mesh(new THREE.BoxBufferGeometry(), new THREE.MeshBasicMaterial());
  bulb.scale.setScalar(3);
  bulb.position.set(55, shift, 14);
  base.add(bulb);

  let light = new THREE.SpotLight(0xffffff, 2, 1000, (THREE.Math.degToRad(40)), 0.15);
  light.position.set(55, shift, 14);
  base.add(light);

  let lightTarget = new THREE.Object3D();
  lightTarget.position.set(55 + 0.1, shift + 0.8, 13.95);
  base.add(lightTarget);

  light.target = lightTarget;
}


function hitDetection() 
{
  const playerHitZone1 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
    true,
    15
  );

  const playerHitZone2 = getHitZonePosition(
    playerCar.position,
    playerAngleInitial + playerAngleMoved,
    true,
    -15
  );

  if (config.showHitZones) {
    playerCar.userData.hitZone1.position.x = playerHitZone1.x;
    playerCar.userData.hitZone1.position.y = playerHitZone1.y;

    playerCar.userData.hitZone2.position.x = playerHitZone2.x;
    playerCar.userData.hitZone2.position.y = playerHitZone2.y;
  }
  
  let hitType = "none"; 
  const hit = otherVehicles.some((vehicle) => {
    if (vehicle.type == "car") {
      const vehicleHitZone1 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        15
      );

      const vehicleHitZone2 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        -15
      );

      if (config.showHitZones) {
        vehicle.mesh.userData.hitZone1.position.x = vehicleHitZone1.x;
        vehicle.mesh.userData.hitZone1.position.y = vehicleHitZone1.y;

        vehicle.mesh.userData.hitZone2.position.x = vehicleHitZone2.x;
        vehicle.mesh.userData.hitZone2.position.y = vehicleHitZone2.y;
      }

      // The player hits another vehicle
      if (getDistance(playerHitZone1, vehicleHitZone1) < 100) 
      {
        hitType = "car";
        return true;
      }
      if (getDistance(playerHitZone1, vehicleHitZone2) < 100)
      { 
        hitType = "car";
        return true;
      }

      // Another vehicle hits the player
      if (getDistance(playerHitZone2, vehicleHitZone1) < 100)
      {
        hitType = "car" 
        return true;
      }
    }

    if (vehicle.type == "truck") {
      const vehicleHitZone1 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        35
      );

      const vehicleHitZone2 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        0
      );

      const vehicleHitZone3 = getHitZonePosition(
        vehicle.mesh.position,
        vehicle.angle,
        vehicle.clockwise,
        -35
      );

      if (config.showHitZones) {
        vehicle.mesh.userData.hitZone1.position.x = vehicleHitZone1.x;
        vehicle.mesh.userData.hitZone1.position.y = vehicleHitZone1.y;

        vehicle.mesh.userData.hitZone2.position.x = vehicleHitZone2.x;
        vehicle.mesh.userData.hitZone2.position.y = vehicleHitZone2.y;

        vehicle.mesh.userData.hitZone3.position.x = vehicleHitZone3.x;
        vehicle.mesh.userData.hitZone3.position.y = vehicleHitZone3.y;
      }

      // The player hits another vehicle
      if (getDistance(playerHitZone1, vehicleHitZone1) < 100)
      {
        hitType = "truck";
        return true;
      }
      if (getDistance(playerHitZone1, vehicleHitZone2) < 100)
      {
        hitType = "truck";
        return true;
      }
      if (getDistance(playerHitZone1, vehicleHitZone3) < 100)
      {
        hitType = "truck";
        return true;
      }
      // Another vehicle hits the player
      if (getDistance(playerHitZone2, vehicleHitZone1) < 100) 
      {
        hitType = "truck";
        return true;
      }
    }

    if(vehicle.type == "human")
    {
        // console.log("Vehicle Hero Pos : ", vehicle.hero.mesh.position); 
        const HumanHitZone1 = getHitZonePositionAvatar(vehicle.hero.mesh.position);

        if (config.showHitZones) 
        {
        vehicle.hero.mesh.userData.hitZone1.position.x = HumanHitZone1.x;
        vehicle.hero.mesh.userData.hitZone1.position.y = HumanHitZone1.y;
        }

        // The player hits avatar
        if (getDistance(playerHitZone1, HumanHitZone1) < 50) 
        {
          hitType = "human";
          return true;
        }

        // Avatar hits the player (Needed??)
        // if (getDistance(playerHitZone2, HumanHitZone1) < 200) return true;
    }
  });

  // if (hit) 
  // {
  //   speed = 0.0001;
    // console.log(playerCar);
    // if (resultsElement) resultsElement.style.display = "flex";
    // renderer.setAnimationLoop(null); // Stop animation loop
  // }
  // console.log("hit detection mlem: ", hit, hitType);
  return [hit, hitType];
}

window.addEventListener("resize", () => {
  console.log("resize", window.innerWidth, window.innerHeight);

  // Adjust camera
  const newAspectRatio = window.innerWidth / window.innerHeight;
  const adjustedCameraHeight = cameraWidth / newAspectRatio;

  camera.top = adjustedCameraHeight / 2;
  camera.bottom = adjustedCameraHeight / -2;
  camera.updateProjectionMatrix(); // Must be called after change

  positionScoreElement();

  // Reset renderer
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});
