const express = require('express');
const app = express();
const port = 3000;
const fs = require('fs');
var expressWs = require('express-ws')(app);
const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

var worldData = {};
var turtleCommandsToRun = {};
var turtleData = {};


async function saveDataToFile(){
  try{
  fs.writeFileSync('./data.json',JSON.stringify({
    worldData: worldData,
    turtleData : turtleData
  }));
  }catch(error){
    console.log(error);
  }
}
//read data from file and output
try{
  var data = fs.readFileSync('./data.json',{ encoding: 'utf8', flag: 'r' });
  data = JSON.parse(data);
  //console.table(data)

  if (data.worldData !== undefined){worldData = data.worldData}
  if (data.turtleData !== undefined){turtleData = data.turtleData}

  
}catch(error){
  console.log(error)
}



//only really used for local devlopment
const minTurtleLatency = 0


//codes from https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript as i am lazy af
function makeid(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}



async function runTurtleCommands(varTurtleId,code){
  //each instruction has 3 stages
  //sendingInstruction - will wait for other process to tell turtle what todo
  //awaitingResponse - happens after turtle is told what todo, if turtle returns idle it will ask for data again
  //awaitingDeletion - after turtle responses, will be ignored by command sender, meant to be deleted by function that added command to queue


  const turtleId = varTurtleId.toString();
  const requestId = makeid(16);

  //function for waiting for variable to change
  const waitForCommandStatusUpdate = (valueAwaiting) => new Promise((resolve) => {
    const checkVariable = () => {
      //find list item incase item has been removed or added
      const request = turtleCommandsToRun[turtleId].find(item => item.requestId === requestId)
      //look if status has changed
      if (request.currentStatus === valueAwaiting ) {
        resolve(request.currentStatus); // Resolve the promise with the variable value
      } else {
        setTimeout(checkVariable, 10); // Check again after a delay
      }
    };
    checkVariable();
  });




  //make sure turtle has data for it setup
  if (turtleCommandsToRun[turtleId] == undefined){
    turtleCommandsToRun[turtleId] = [];
  }

  //add on the todo list
  turtleCommandsToRun[turtleId].push({
    "currentStatus": "sendingInstruction",
    "requestId": requestId,
    "turtleId": turtleId,
    "code": code,
    "response": {
      "encounteredError":null,
      "returnValue":null
    },
    "turtleData": null
  })

  //wait for update on request
  await waitForCommandStatusUpdate("awaitingDeletion");

  //save return data to variable, delete request then return data
  const itemIndex = turtleCommandsToRun[turtleId].findIndex(item => item.requestId === requestId); //get the item index
  var returnData = turtleCommandsToRun[turtleId][itemIndex].response;
  returnData.turtleData = turtleCommandsToRun[turtleId][itemIndex].turtleData;
  //console.log("returned : " + returnData.returnValue + " for " + requestId)
  turtleCommandsToRun[turtleId].splice(itemIndex, 1);
  
  saveDataToFile()
  return returnData

}

app.get('/updateInfo', (req, res) => {
  try{
    const info = req.query.info;

    if(info==="turtleData"){
      res.send(JSON.stringify(turtleData)); 

    }else if(info==="worldDataBlockPositions"){
      var worldDataBlocks = [];
      for (const [key, value] of Object.entries(worldData)) {
        var getPos = key.split(",");
        worldDataBlocks.push({x: getPos[0],y: getPos[1],z: getPos[2]});
      }

      res.send(JSON.stringify(worldDataBlocks));
    }else if(info==="blockData"){
      const x = req.query.x;
      const y = req.query.y;
      const z = req.query.z;

      var returnValue = worldData[`${x},${y},${z}`]
      if (returnValue == undefined) {
        returnValue = "minecraft:air";
      }
      var returnData = {};
      returnData.name = returnValue;
      res.send(JSON.stringify(returnData));

    }else if(info==="getTurtlesConnected"){
      var turtlesConnected = [];


      for (const item in turtleData) {
        turtlesConnected.push(item);
      }
      
      res.send(JSON.stringify(turtlesConnected));  

    }else if(info==="latestClient"){
      res.send(fs.readFileSync("../client/startup.lua"));


    }else{
      res.status(404);
    }

  }catch(error){
    res.status(500);
    console.log(error);
  }
  
});

app.post('/runCode', async (req, res) => {
  try{
    
    var turtleId = req.body.turtleId;
    var code = req.body.code;
    var returnValue = await runTurtleCommands(turtleId,code);
    res.send(JSON.stringify(returnValue));

  }catch(error){
    console.log(error);
    res.status(500);
  }
});

function rotationToPos(directionVariable){
  var dirVector = {"x":0,"z":0}
  if (directionVariable === 0){ //north
    dirVector.z = 1
  }else if (directionVariable === 1){ //east
    dirVector.x = 1;
  }else if (directionVariable === 2){ //south
    dirVector.z = -1;
  }else if (directionVariable === 3){ // west
    dirVector.x = -1;
  }
  return dirVector
}

async function updateBlocksAroundTurtle(turtleId){
  //get return data and save it to value
    //rn only store names as we will store more later
    var outputDownBlockData = await runTurtleCommands(turtleId, `return {{turtle.inspectUp()},{turtle.inspect()},{turtle.inspectDown()}}`);

    //this is used incase it gets out of sync with turtle pos, alot of fast movements causes this alot
    const turtlePos = {
      "x": outputDownBlockData.turtleData.position.x,
      "y": outputDownBlockData.turtleData.position.y,
      "z": outputDownBlockData.turtleData.position.z
    }

    const forwardDirOffset = rotationToPos(outputDownBlockData.turtleData.direction);


    //up
    if (outputDownBlockData.returnValue[0][0]===true) {
      worldData[turtlePos.x.toString() + "," + (turtlePos.y+1).toString() + "," + turtlePos.z.toString()] = outputDownBlockData.returnValue[0][1].name;
    }else{
      delete worldData[turtlePos.x.toString() + "," + (turtlePos.y+1).toString() + "," + turtlePos.z.toString()];
    }
    //infront
    if (outputDownBlockData.returnValue[1][0]===true) {
      worldData[(turtlePos.x+forwardDirOffset.x).toString() + "," + turtlePos.y.toString() + "," + (turtlePos.z+forwardDirOffset.z).toString()] = outputDownBlockData.returnValue[1][1].name;
    }else{
      delete worldData[(turtlePos.x+forwardDirOffset.x).toString() + "," + turtlePos.y.toString() + "," + (turtlePos.z+forwardDirOffset.z).toString()];
    }
    //below
    if (outputDownBlockData.returnValue[2][0]===true) {
      worldData[turtlePos.x.toString() + "," + (turtlePos.y-1).toString() + "," + turtlePos.z.toString()] = outputDownBlockData.returnValue[2][1].name;
    }else{
      delete worldData[turtlePos.x.toString() + "," + (turtlePos.y-1).toString() + "," + turtlePos.z.toString()];
    }

    saveDataToFile()
}

app.post('/moveTurtle', async (req, res) => {
  try{
    var turtleId = req.body.turtleId;
    var movement = req.body.movement;

    var returnData = {};
    returnData.encounteredError = true;
    returnData.returnCode = "unkownCommand";

    forwardDirOffset = {}


    if (movement === "forward"){
      returnData = await runTurtleCommands(turtleId,"return turtle.forward()");
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].position.x += forwardDirOffset.x;
        turtleData[turtleId].position.z += forwardDirOffset.z;
      }

    }else if (movement === "back"){
      returnData = await runTurtleCommands(turtleId,"return turtle.back()");
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].position.x += forwardDirOffset.x*-1;
        turtleData[turtleId].position.z += forwardDirOffset.z*-1;
      }

    }else if (movement === "left"){
      returnData = await runTurtleCommands(turtleId,"return turtle.turnLeft()");
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].direction += -1;
        if (turtleData[turtleId].direction <= -1){
          turtleData[turtleId].direction = 3
        }
      }
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);

    }else if (movement === "right"){
      returnData = await runTurtleCommands(turtleId,"return turtle.turnRight()");
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].direction += 1;
        if (turtleData[turtleId].direction >= 4){
          turtleData[turtleId].direction = 0
        }
      }
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);

    }else if (movement === "up"){
      returnData = await runTurtleCommands(turtleId,"return turtle.up()");
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].position.y += 1;
      }
    }else if (movement === "down"){
      returnData = await runTurtleCommands(turtleId,"return turtle.down()");
      forwardDirOffset = rotationToPos(turtleData[turtleId].direction);
      if (returnData.encounteredError === false && returnData.returnValue === true) {
        turtleData[turtleId].position.y += -1;
      }
    }

    await updateBlocksAroundTurtle(turtleId);

    saveDataToFile()
    res.send(returnData);


  }catch(error){
    console.log(error);
    res.status(500);
  }
});

app.get('/updateBlocksAroundTurtle', async (req, res) => {
  try{
    const turtleId = req.query.turtleId;

    await updateBlocksAroundTurtle(turtleId);

    res.send("");

  }catch(error){
    console.log(error);
    res.status(500);
  }
});

app.ws('/', function(ws, req) {
  
  ws.on('message', async function(msg) {
    try{
      const turtleMessageData = JSON.parse(msg);
      const turtleId = turtleMessageData.turtleId.toString();
      //console.log("<= " + msg);
      
      if (turtleData[turtleId] === undefined) {
        turtleData[turtleId] = {
          "position": {"x":0,"y":0,"z":0},
          "direction": 0
        };
      }


      //sole use of this is for easier debugging
      function sendResponse(response){
        //console.log("=> " + response)
        setTimeout(()=> {
          ws.send(response);
        },minTurtleLatency);
      }
      
      if (turtleMessageData.currentStatus === "gotResponse"){
        const requestId = turtleMessageData.requestId;

        //change data as response has been gatherd
        const itemIndex = turtleCommandsToRun[turtleId].findIndex(item => item.requestId === requestId); //get the item index
        turtleCommandsToRun[turtleId][itemIndex].response = turtleMessageData.response;
        turtleCommandsToRun[turtleId][itemIndex].currentStatus = "awaitingDeletion";
        turtleCommandsToRun[turtleId][itemIndex].turtleData = turtleData[turtleId];

        //add thing for 'commandNeverRun' and return error


      }else{
          if (turtleMessageData.currentStatus === "idle"){
            //make sure value is there for list
            if (typeof turtleCommandsToRun[turtleId] === "undefined") {
              turtleCommandsToRun[turtleId] = []
            }
            //make sure there is something to run
            if (turtleCommandsToRun[turtleId].length >= 1) {
              if (turtleCommandsToRun[turtleId][0].currentStatus === "sendingInstruction" ){
                sendResponse(JSON.stringify({
                  "currentStatus": "runCode",
                  "code": turtleCommandsToRun[turtleId][0].code,
                  "requestId": turtleCommandsToRun[turtleId][0].requestId,
                  "turtleId": turtleId
                }));

                turtleCommandsToRun[turtleId][0].currentStatus = "awaitingResponse"

                return
              }else if (turtleCommandsToRun[turtleId][0].currentStatus === "awaitingResponse" ){
                sendResponse(JSON.stringify({
                  "currentStatus": "getResponse",
                  "code": turtleCommandsToRun[turtleId][0].code,
                  "requestId": turtleCommandsToRun[turtleId][0].requestId,
                  "turtleId": turtleId
                }));

                return
              }
            }
          }
        }
      sendResponse(JSON.stringify({
        "currentStatus": "wait",
        "turtleId": turtleId
      }))

    }catch (error){
      console.log(error);
    }
    }
  );
});