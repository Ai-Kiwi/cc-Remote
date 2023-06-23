import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x55cee0 );
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.getElementById('render-window').appendChild(renderer.domElement);

//will be controllable later when i get around to it
var turtleId = null
var turtleData = {};

var codeToRun = "";
var blockCache = {};

async function runCode(code){
    var response = await fetch("./runCode", {
    method: "post",
    body: JSON.stringify(
    {
      "turtleId": turtleId,
      "code": code,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });
  if (response.ok) {
    var json = await response.json();
    //if there is a error report it
    if(json.encounteredError===true){
      alert(json.returnValue);
    }else{
      return json.returnValue;
    }
  }else{
    alert("HTTP-Error: " + response.status);
  }
  alert("unkown error in movement")
  return;
}


async function moveTurtle(movement){
  var response = await fetch("./moveTurtle", {
    method: "post",
    body: JSON.stringify(
    {
      "turtleId": turtleId,
      "movement": movement,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8"
    }
  });
  updateTurtle(turtleId);
  return;
}

//bind buttons to functions
//document.getElementById("left-key").addEventListener("click", () => {runCode("turtle.turnLeft()")}, false);
//document.getElementById("forward-key").addEventListener("click", () => {runCode("turtle.forward()")}, false);
//document.getElementById("right-key").addEventListener("click", () => {runCode("turtle.turnRight()")}, false);

document.getElementById("refuel-key").addEventListener("click", () => {runCode("turtle.refuel(1)")}, false);
document.getElementById("turtle-id-select").addEventListener("change", () => {turtleId = document.getElementById("turtle-id-select").value}, false);




document.getElementById("code-input").addEventListener("keydown", keyData => {
  if(keyData.code == "Enter"){
    runCode(keyData.target.value);
  }
});


const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set( 2, 2, 2 );
controls.update();


async function cubeUpdateRenderBlock(x,y,z){
  const response = await fetch("./blockData?" + new URLSearchParams({
    x: x,
    y: y,
    z: z,
  }));

  
  if(response.ok){

    const jsonData = await response.json();

    //remote it if it is air
    if(jsonData.name === "minecraft:air"){
      //return if its just air as thats not something worth drawing
      // Remove item if it exists in the list of items
      if (blockCache[`${x},${y},${z}`] !== undefined) {
        const shapes = blockCache[`${x},${y},${z}`].shapes;
        shapes.forEach(shape => {
          scene.remove(shape);
        });
        shapes.length = 0; // Clear the array
        renderer.render(scene, camera);
        delete blockCache[`${x},${y},${z}`];
      }
      return;
    }
    
    //if it doesnt exist create it
    if(!(typeof blockCache[`${x},${y},${z}`] !== "undefined")){
      blockCache[`${x},${y},${z}`] = {
        data: jsonData.name,
        shapes: []
      };
    }

    //if it already exists leave it
    if (blockCache[`${x},${y},${z}`].shapes.length >= 1){
      return;
    }
    

    //must need creating then if it has passed to here
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: Math.random() * 0x808008 + 0x808080, transparent:true, opacity: 1} );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.set(x*-1,y,z);
    scene.add( cube );
    renderer.render(scene, camera);

    blockCache[`${x},${y},${z}`].shapes.push(cube);
  }
}

async function updateBlocksAroundTurtle(){
  await fetch("./updateBlocksAroundTurtle?" + new URLSearchParams({
    turtleId: turtleId
  }));

  //update top infront and bottom blocks turtleId
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x,turtleData[turtleId].position.y+1,turtleData[turtleId].position.z);
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x,turtleData[turtleId].position.y-1,turtleData[turtleId].position.z);
  //update blocks around
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x,turtleData[turtleId].position.y,turtleData[turtleId].position.z+1);
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x,turtleData[turtleId].position.y,turtleData[turtleId].position.z-1);
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x+1,turtleData[turtleId].position.y,turtleData[turtleId].position.z);
  await cubeUpdateRenderBlock(turtleData[turtleId].position.x-1,turtleData[turtleId].position.y,turtleData[turtleId].position.z);
}


async function updateTurtle(turtleIdToUpdate) {
  //get updated turtle data
  const response = await fetch("./updateInfo?" + new URLSearchParams({
    info: "turtleData"
  }));
  if(response.ok){
    const jsonData = await response.json();
    const receivedTurtleData = jsonData[turtleIdToUpdate];

    if (turtleData[turtleIdToUpdate] == undefined){
      turtleData[turtleIdToUpdate] = {};
    }


    turtleData[turtleIdToUpdate].position = receivedTurtleData.position;
    turtleData[turtleIdToUpdate].direction = receivedTurtleData.direction;



    //update top infront and bottom blocks turtleId
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y+1,receivedTurtleData.position.z);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y-1,receivedTurtleData.position.z);
    //update blocks around
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y,receivedTurtleData.position.z+1);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y,receivedTurtleData.position.z-1);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x+1,receivedTurtleData.position.y,receivedTurtleData.position.z);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x-1,receivedTurtleData.position.y,receivedTurtleData.position.z);
    
    turtleData[turtleIdToUpdate].turtleObject.position.y = receivedTurtleData.position.y;
    turtleData[turtleIdToUpdate].turtleObject.position.x = receivedTurtleData.position.x*-1;
    turtleData[turtleIdToUpdate].turtleObject.position.z = receivedTurtleData.position.z;

    //update player arrow
    var offsetX = 0;
    var offsetZ = 0;
    if (turtleData[turtleIdToUpdate].direction === 0){ //north
      offsetZ = 1;
    }else if (turtleData[turtleIdToUpdate].direction === 1){ //east
      offsetX = -1;
    }else if (turtleData[turtleIdToUpdate].direction === 2){ //south
      offsetZ = -1;
    }else if (turtleData[turtleIdToUpdate].direction === 3){ // west
      offsetX = 1;
    }

    const dir = new THREE.Vector3( offsetX, 0, offsetZ );
    turtleData[turtleIdToUpdate].turtleObject.setDirection(dir);
  }
}

//add turtles
const turtlesConnectedRequest = await fetch("./getTurtlesConnected?" + new URLSearchParams({}));
if(turtlesConnectedRequest.ok){
  const turtlesConnected = await turtlesConnectedRequest.json();
  //make sure there are turtles connected
  if (turtlesConnected.length == 0){
    alert("please connect turtle/s to use");
    location.reload();
  }
  
  const turtleSelectFeild = document.getElementById("turtle-id-select");
  for (const turtleAdding in turtlesConnected){
    var option = document.createElement("option");
    const turtleAddingId = turtlesConnected[turtleAdding]
    option.value = turtleAddingId;
    option.text = turtleAddingId;
    turtleSelectFeild.appendChild(option);

    //create 3d model for it
    turtleData[turtleAddingId] = {};
    turtleData[turtleAddingId].position = {x:0,y:0,z:0};
    turtleData[turtleAddingId].direction = 0;
    const dir = new THREE.Vector3( 1, 0, 0 );
    const origin = new THREE.Vector3( 0, 0, 0 );
    const turtleObj = new THREE.ArrowHelper( dir, origin, 1, 0x000000, 0.5, 0.5 );
    turtleData[turtleAddingId].turtleObject = turtleObj;
    scene.add( turtleObj );

    updateTurtle(turtleAddingId);
  }
  turtleId = turtlesConnected[0]
}

const turtleFuelBar = document.getElementById('turtle-fuel-bar')
const turtleFuelBarText = document.getElementById('turtle-fuel-bar-text')
async function updateFuelDisplay(){
  try{ //dirty af work around for turtleId not being anything apon starting
    const maxFuel = parseFloat(await runCode("return turtle.getFuelLimit()"));
    const currentFuel = parseFloat(await runCode("return turtle.getFuelLevel()"));


    turtleFuelBar.value = currentFuel;
    turtleFuelBar.max = maxFuel;
    turtleFuelBarText.textContent = `fuel (${currentFuel}/${maxFuel}):`
  }catch(error){
    console.log(error)
  }
}
setInterval(updateFuelDisplay, 1000);



//add keybinds
document.addEventListener('keydown', (event) => {
  //this is ultra temp will be moved over to be a system where it is instead a custom move page
  //reson for this is to stop it from going out of sync and make sure it stays upto date

  if(event.key == "w"){
    //forward
    moveTurtle("forward");
  }else if (event.key == "s"){
    //backwards
    moveTurtle("back");
  }else if (event.key == "a"){
    //turn left
    moveTurtle("left");
  }else if (event.key == "d"){
    //turn right
    moveTurtle("right");

  }else if (event.key == "q"){
    //go down
    moveTurtle("down");
  }else if (event.key == "e"){
    //go up
    moveTurtle("up");

  }else if (event.key == "r"){
    //dig up
    const moveFunction = async () => {
      await runCode("return turtle.digUp()");
      updateBlocksAroundTurtle();
    }
    moveFunction();

  }else if (event.key == "f"){
    //dig
    const moveFunction = async () => {
      await runCode("return turtle.dig()");
      updateBlocksAroundTurtle();
    }
    moveFunction();

  }else if (event.key == "v"){
    //dig down
    const moveFunction = async () => {
      await runCode("return turtle.digDown()");
      updateBlocksAroundTurtle();
    }
    moveFunction();
    
  }

  
  
});


const blockPositionsRequest = await fetch("./updateInfo?" + new URLSearchParams({
  info: "worldDataBlockPositions"
}));
if(blockPositionsRequest.ok){
  const jsonData = await blockPositionsRequest.json();
  for (const block of jsonData) {
    cubeUpdateRenderBlock(block.x,block.y,block.z);
  }
}
updateTurtle(turtleId)




function animate() {
    requestAnimationFrame( animate );

    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;
    //camera.position.x++;
    controls.update();
    renderer.render( scene, camera );
}

animate();