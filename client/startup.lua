local pastInstructions = {}
local Screen = {}
Screen.width, Screen.height = term.getSize()
term.setCursorPos(1,Screen.height)



--   open file and get data about turtle

--see if it exists
print("getting local saved data")
local turtleData = {}
if fs.exists("CCRemote.data") == true then 
    print("found config file, reading...")
    local file = fs.open("CCRemote.data", "r")
    turtleData = textutils.unserialiseJSON(file.readAll())
    file.close()
end

if turtleData.turtleId == nil then  turtleData.turtleId = tostring(math.random(1,1000)) end
local turtleId = turtleData.turtleId

local file = fs.open("CCRemote.data", "w")
file.write(textutils.serialiseJSON(turtleData))
file.close()
for k, v in pairs(turtleData) do
    print(tostring(k) .. " : " .. tostring(v))
end





--   make sure client software is up to date

--make sure lib is there
print("looking for  Elliptic Curve Cryptography lib")
local function downloadEccLib()
    print("failed to find downloading")
    local webFile = http.get("https://pastebin.com/raw/ZGJGBJdg")
    local ECCfile = fs.open("ecclib.lua", "w")
    ECCfile.write(webFile.readAll())
    ECCfile.close()
    webFile.close()
end
if not fs.exists("ecclib.lua") then
    local hadNoError, reponseError = pcall(downloadEccLib)
    if not hadNoError then
        print(reponseError)
        print("failed to downloading restarting...")
        sleep(5)
        os.reboot()
    end
else
    print("found lib")
end
local ECClib = require("ecclib")

--run sha on software
print("testing if latest is installed")
print("getting version installed hash")
local localClientRequest = fs.open("startup.lua","r")
local serverClientRequest = http.get("http://localhost:3000/updateInfo?info=latestClient", nil)
if not serverClientRequest then
    print("failed to contact server")
    sleep(3)
    os.reboot()
end
local serverClient = serverClientRequest.readAll()
serverClientRequest.close()

local localHash = nil
--means faiiled to find file so overide
if not (localClientRequest == nil) then
    localHash = tostring(ECClib.sha256.digest(localClientRequest.readAll()))
end
local remoteHash = tostring(ECClib.sha256.digest(serverClient))
localClientRequest.close()
--print out hash
print("#hashs")
print(localHash)
print(remoteHash)

if localHash == remoteHash then
    print("client already up to date")
else
    print("clinets out of date updating")
    local startupFile = fs.open("startup.lua", "w")
    startupFile.write(serverClient)
    startupFile.close()
    
    print("restarting...")
    os.sleep(3)
    os.reboot()
end





--  start up software

local function createIdleResponce()
    local idleDataToSend = {}
    idleDataToSend.turtleId = turtleId
    idleDataToSend.currentStatus = "idle"
    return idleDataToSend
end


local function handleMessage(message)
    local tableMessage = textutils.unserialiseJSON(message)
    local requestId = tableMessage.requestId

    --create data for returning
    local returnValue = {}
    returnValue.requestId = requestId
    returnValue.turtleId = turtleId
    returnValue.response = {}


    if tableMessage.turtleId ~= turtleId then return nil end -- make sure server is talking to me

    if tableMessage.currentStatus == "runCode" then
        --clear past instructions as this means not needed as handling new one
        --can be assumed old are not needed as one thing is sent at a time
        pastInstructions = {}
        pastInstructions[requestId] = {}

        --define variables for return
        successRunningCode = false
        ReturnMessage = nil

        --load and run the function and report code as necessarily
        --btw if you are reading this code and see a cleaner way todo it please do so, I don't like this
        local func, errorMakingFunction = load(tableMessage.code)
        if func then
            successRunningCode, ReturnMessage = pcall(func)
        else
            returnValue.response.encounteredError = true
            returnValue.response.returnValue = ReturnMessage
        end
        if successRunningCode then
            returnValue.response.encounteredError = false
            returnValue.response.returnValue = ReturnMessage
        else
            returnValue.response.encounteredError = true
            returnValue.response.returnValue = errorMakingFunction
        end

        returnValue.currentStatus = "gotResponse"
        pastInstructions[requestId].encounteredError = returnValue.response.encounteredError
        pastInstructions[requestId].returnValue = returnValue.response.returnValue

    elseif tableMessage.currentStatus == "getResponse" then
        returnValue.currentStatus = "gotResponse"
        if pastInstructions[requestId] then
            returnValue.response.returnValue = pastInstructions[requestId].returnValue
            returnValue.response.encounteredError = pastInstructions[requestId].encounteredError
        else
            --there is no longer return data, this is most likely a very damn big problem unless they have just restarted it which is most likely so we are just gotta ignore it lol
            --will add a custom error report when i get a chance
            returnValue.response.encounteredError = true
            returnValue.response.returnValue = "commandNeverRun"
        end

    elseif tableMessage.currentStatus == "wait" then
        os.sleep(0.1)
        return createIdleResponce()
    else
        error()
    end

    if returnValue == {} then
        error()
    end

    
    return returnValue
end


local lastMessageTime = os.epoch("local")

local function connectToWebsocket()

    term.setCursorPos(1,Screen.height)
    print("connecting to server at ws://127.0.0.1:3000/")
    local ws, wsError = http.websocket("ws://127.0.0.1:3000/")
    if ws == false then
        error("failed to connect to server with error : " .. wsError)
    else
        print("connected to server")
    end
    
    lastMessageTime = os.epoch("local")
    ws.send(textutils.serialiseJSON(createIdleResponce()))
    while true do
        --display ping
        term.setBackgroundColor(colors.gray)
        term.setCursorPos(1,1)
        term.clearLine()
        term.write(tostring("CC:Remote   id : " .. turtleId .. "   ping: " .. os.epoch("local") - lastMessageTime) .. "ms")
        term.setBackgroundColor(colors.black)
        term.setCursorPos(1,Screen.height)
        local wsReceivedMessage = ws.receive(10)

        



        if wsReceivedMessage then
            local successRunningCode, returnResult = pcall(handleMessage, wsReceivedMessage)
            if successRunningCode == false then
                print("critical error : " .. tostring(returnResult))
                lastMessageTime = os.epoch("local")
                ws.send(textutils.serialiseJSON(createIdleResponce()))
            else
                lastMessageTime = os.epoch("local")
                ws.send(textutils.serialiseJSON(returnResult))
            end
        else
            print("timed out, sending more data")
            lastMessageTime = os.epoch("local")
            ws.send(textutils.serialiseJSON(createIdleResponce()))
        end
    end

end

worked, returned = pcall(connectToWebsocket)
print(returned)

print("restarting in")
print(3)
os.sleep(1)
print(2)
os.sleep(1)
print(1)
os.sleep(1)
os.reboot()