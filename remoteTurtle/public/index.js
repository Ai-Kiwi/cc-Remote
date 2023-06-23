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
const turtleId = "1"
var turtleData = {};
turtleData[turtleId] = {};
turtleData[turtleId].position = {x:0,y:0,z:0};
turtleData[turtleId].direction = 0;
const dir = new THREE.Vector3( 1, 0, 0 );
const origin = new THREE.Vector3( 0, 0, 0 );
const turtleObj = new THREE.ArrowHelper( dir, origin, 1, 0x000000, 0.5, 0.5 );
turtleData[turtleId].turtleObject = turtleObj;
scene.add( turtleObj );

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
  updateTurtle();
  return;
}

//bind buttons to functions
//document.getElementById("left-key").addEventListener("click", () => {runCode("turtle.turnLeft()")}, false);
//document.getElementById("forward-key").addEventListener("click", () => {runCode("turtle.forward()")}, false);
//document.getElementById("right-key").addEventListener("click", () => {runCode("turtle.turnRight()")}, false);

document.getElementById("refuel-key").addEventListener("click", () => {runCode("turtle.refuel(1)")}, false);





document.getElementById("code-input").addEventListener("keydown", keyData => {
  if(keyData.code == "Enter"){
    runCode(keyData.target.value);
  }
});


const controls = new OrbitControls( camera, renderer.domElement );

camera.position.set( 2, 2, 2 );
controls.update();

//async function NewGetBlockData(x,y,z,fullBlockName){
//  //get rid of starting minecraft:
//  //will be recoded to support modded blocks sometime
//  var blockName = fullBlockName.split(":")[1];
//
//  //get the blockstate data
//  var blockstateJsonData = await fetch(`./mc/models/block/${blockName}.json`);
//  blockstateJsonData = await blockstateJsonData.json();
//}


async function cubeUpdateRenderBlock(x,y,z){
  const response = await fetch("./blockData?" + new URLSearchParams({
    x: x,
    y: y,
    z: z,
  }));

  console.table([x,y,z]);
  
  if(response.ok){

    const jsonData = await response.json();
    console.log(jsonData.name);

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
    //console.log(typeof blockCache[`${x},${y},${z}`].shapes);
    if (blockCache[`${x},${y},${z}`].shapes.length >= 1){
      return;
      //temp for when it moves to a system that has tags and what not
      //scene.remove(blockCache[`${x},${y},${z}`].shapes[0]);
      //delete blockCache[`${x},${y},${z}`].shapes[0];
    }
    

    //must need creating then if it has passed to here
    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.MeshBasicMaterial( {color: Math.random() * 0x808008 + 0x808080, transparent:true, opacity: 1} );
    const cube = new THREE.Mesh( geometry, material );
    cube.position.set(x*-1,y,z);
    scene.add( cube );
    renderer.render(scene, camera);


    blockCache[`${x},${y},${z}`].shapes.push(cube);
    console.log(blockCache);
    

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


async function updateTurtle() {
  //get updated turtle data
  const response = await fetch("./updateInfo?" + new URLSearchParams({
    info: "turtleData"
  }));
  if(response.ok){
    const jsonData = await response.json();
    console.log(jsonData);
    const receivedTurtleData = jsonData[turtleId];
    console.log(receivedTurtleData);

    if (turtleData[turtleId] == undefined){
      turtleData[turtleId] = {};
    }


    turtleData[turtleId].position = receivedTurtleData.position;
    turtleData[turtleId].direction = receivedTurtleData.direction;



    //update top infront and bottom blocks turtleId
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y+1,receivedTurtleData.position.z);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y-1,receivedTurtleData.position.z);
    //update blocks around
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y,receivedTurtleData.position.z+1);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x,receivedTurtleData.position.y,receivedTurtleData.position.z-1);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x+1,receivedTurtleData.position.y,receivedTurtleData.position.z);
    await cubeUpdateRenderBlock(receivedTurtleData.position.x-1,receivedTurtleData.position.y,receivedTurtleData.position.z);
    
    turtleData[turtleId].turtleObject.position.y = receivedTurtleData.position.y;
    turtleData[turtleId].turtleObject.position.x = receivedTurtleData.position.x*-1;
    turtleData[turtleId].turtleObject.position.z = receivedTurtleData.position.z;

    //update player arrow
    var offsetX = 0;
    var offsetZ = 0;
    if (turtleData[turtleId].direction === 0){ //north
      offsetZ = 1;
    }else if (turtleData[turtleId].direction === 1){ //east
      offsetX = -1;
    }else if (turtleData[turtleId].direction === 2){ //south
      offsetZ = -1;
    }else if (turtleData[turtleId].direction === 3){ // west
      offsetX = 1;
    }

    const dir = new THREE.Vector3( offsetX, 0, offsetZ );
    turtleData[turtleId].turtleObject.setDirection(dir);
  }
}


//all the stuff here is no being used as it is being recoded from scratch, this was a attempt to render based on block images but is not done yet will be done later.


//function drawFaceOfCube(textureName,xPos,Ypos,zPos,xRot,yRot,zRot) {
//    //covert rotastions from degrees to radians as who uses radians, well really everyone but not me so im to stupid to use them.
//    let xRotRadian = xRot * (Math.PI/180);
//    let yRotRadian = yRot * (Math.PI/180);
//    let zRotRadian = zRot * (Math.PI/180);
//
//    const geometry = new THREE.PlaneGeometry( 1, 1 );
//    const texture = new THREE.TextureLoader().load( './mc/textures/block/' + textureName);
//    texture.magFilter = THREE.NearestFilter;
//    texture.minFilter = THREE.NearestFilter;
//    const material = new THREE.MeshBasicMaterial( { map: texture } );
//    //const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.SingleSide} );
//    const plane = new THREE.Mesh( geometry, material );
//    plane.position.set(xPos,Ypos,zPos)
//    plane.rotation.set(xRotRadian,yRotRadian,zRotRadian)
//    scene.add( plane );
//    return plane;
//}
//
//async function getBlockData(blockName) {
//  //this system is currently via simple, right now only supports getting block data
//  //
//  //if the block is not a normal block it will return null
//  try{
//    var blockSideData = {}
//
//    var blockJsonData = await fetch(`./mc/models/block/${blockName}.json`)
//    blockJsonData = await blockJsonData.json()
//
//    var cubeTypeJsonName = blockJsonData.parent;
//    cubeTypeJsonName = cubeTypeJsonName.split('/')[1]; // gets value after last slash
//    
//    var cubeTypeJsonData = await fetch(`./mc/models/block/${cubeTypeJsonName}.json`)
//    cubeTypeJsonData = await cubeTypeJsonData.json()
//
//
//    
//    //if (cubeTypeJsonName === "cube_all"){
//      
//      for(const texture in blockJsonData.textures){
//        const value = blockJsonData.textures[texture];
//        if(value == ""){
//        }else{
//          blockSideData["#" + texture] = value;
//        }
//
//      }
//
//      function getSideValue(nameValue){
//        const varForSide = cubeTypeJsonData.textures[nameValue];
//        var value = blockSideData[varForSide];
//        if (value === undefined) {
//          value = blockSideData["#all"];
//        }
//        
//        var justname = value.split('/')[1];
//
//        return justname
//      }
//
//
//      var sides = {}
//      sides["down"] = `${getSideValue("down")}.png`;
//      sides["up"] = `${getSideValue("up")}.png`;
//      sides["north"] = `${getSideValue("north")}.png`;
//      sides["east"] = `${getSideValue("east")}.png`;
//      sides["south"] = `${getSideValue("south")}.png`;
//      sides["west"] = `${getSideValue("west")}.png`;
//      return sides
//
//    //}else{
//    //  
//    //  return null;
//    //}
//
//  } catch (error) {
//    console.log(error);
//    return null;
//  }
//
//
//}
//
//async function createCube(x,y,z,name) {
//    //currently system only supports full blocks so it assumes it is a fullblock
//    
//    //blocksates not implemented yet
//    //opens up model file for it 
//    
//    //let blockData = getData();
//    //console.log(blockData);
//
//    var sides = await getBlockData(name)
//    var cubeSideData = {}
//
//    const cubeOffset = 0.5
//    //4 sides
//    cubeSideData["west"] = drawFaceOfCube(sides["west"],(cubeOffset*-1)+x,0+y,0+z,0,-90,0)
//    cubeSideData["south"] = drawFaceOfCube(sides["south"],0+x,0+y,cubeOffset+z,0+z,0,0)
//    cubeSideData["east"] = drawFaceOfCube(sides["east"],cubeOffset+x,0+y,0+z,0,90,0)
//    cubeSideData["north"] = drawFaceOfCube(sides["north"],0+x,0+y,(cubeOffset*-1)+z,0,180,0)
//    //top and bottom
//    cubeSideData["up"] = drawFaceOfCube(sides["up"],0+x,(cubeOffset*-1)+y,0+z,90,0,0)
//    cubeSideData["down"] = drawFaceOfCube(sides["down"],0+x,cubeOffset+y,0+z,-90,0,0)
//
//    return null;
//
//
//    //const geometry = new THREE.BoxGeometry( 1, 1, 1 );
//    //
//    //
//    //const cube = new THREE.Mesh( geometry, material );
//    //cube.material.materials[4].map = newTexture;
//    //cube.material.needsUpdate = true;
//
//    //cube.position.set(x,y,z)
//    //return cube;
//    
//}



//for (let x = -3; x < 3; x++) {
//  for (let y = -3; y < 3; y++) {
//    for (let z = -3; z < 3; z++) {
//      var cubeData = await updateCubeData(x,y,z)
//      if (cubeData === "air") {
//        
//      }else{
//        console.log(cubeData);
//        await createCube(x,y,z,cubeData);
//      }
//    } 
//  }
//}

//var cubeData = await updateCubeData(0,0,0)
//await createCube(0,0,0,cubeData);


//await createCube(-2,0,0,"dirt")
//await createCube(0,0,0,"acacia_log")
//await createCube(2,0,0,"stone")



const turtleFuelBar = document.getElementById('turtle-fuel-bar')
const turtleFuelBarText = document.getElementById('turtle-fuel-bar-text')
async function updateFuelDisplay(){


  const maxFuel = parseFloat(await runCode("return turtle.getFuelLimit()"));
  const currentFuel = parseFloat(await runCode("return turtle.getFuelLevel()"));


  turtleFuelBar.value = currentFuel;
  turtleFuelBar.max = maxFuel;
  turtleFuelBarText.textContent = `fuel (${currentFuel}/${maxFuel}):`
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


const response = await fetch("./updateInfo?" + new URLSearchParams({
  info: "worldDataBlockPositions"
}));
if(response.ok){
  const jsonData = await response.json();
  for (const block of jsonData) {
    cubeUpdateRenderBlock(block.x,block.y,block.z);
    console.log(block);
  }
}
updateTurtle()




function animate() {
    requestAnimationFrame( animate );

    //cube.rotation.x += 0.01;
    //cube.rotation.y += 0.01;
    //camera.position.x++;
    controls.update();
    renderer.render( scene, camera );
}

animate();