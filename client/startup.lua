local pastInstructions = {}
local turtleId = "1"

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
    local ws, wsError = http.websocket("ws://127.0.0.1:3000/")
    if ws == false then
        print("failed to connect to server with error : " .. wsError)
    end
    
    lastMessageTime = os.epoch("local")
    ws.send(textutils.serialiseJSON(createIdleResponce()))
    while true do
        local wsReceivedMessage = ws.receive(10)
        print("server responded in " .. tostring(os.epoch("local") - lastMessageTime) .. "ms")
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


print(3)
os.sleep(1)
print(2)
os.sleep(1)
print(1)
os.sleep(1)
os.reboot()

