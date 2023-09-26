# CC:Remote
CC:Remote is an experimental program used to remotely control and manage CC:Tweaked turtles all from a simple to use 3d ui on your computer. CC:Remote is a project that I have been wanting to create for a long time now, however have only recently got around to making.

https://github.com/Ai-Kiwi/cc-Remote/assets/66819523/fa40bdf9-f57b-4124-a028-d3f17308a3f5

## features
 * high reliability.
 * flexibility.
 * multi turtle support.
 * little to no reliance on clients (turtles) instead mostly all handled by the server.

## contributing
Contributions are always welcome, no matter how small, such as fixing a minor typo, or a minor bug report or as large as a complete recode of the majority of the codebase. Some of the ways you could contribute include:
 * filing a bug report on the issues tab.
 * suggesting ideas for things that could be changed.
 * fixing a typo.
 * improving our documentation/instructions.
 * cleaning up code or recoding parts of the code. 
 * adding new features.



## Todo
 * fix desync on shutdown (fixes if shutdown when movement happens)
   * should be custom system for on shutdown so new turtle commands can't be added
   * could also save commands running to file and then add hooks to it when restarted (would require run code function rewrite) 
 * move todo over to github issues
 * change system for web socket (websocket makes sure messages are sent)
 * improve latancy
   * rewrite movement function for client to possibly predict movements ahead of time and then valadate
   * parral functions for getting blocks nearby so less calls are made on movement
 * remove data.json file off github
 * add how to install instructions
 * more fancy ui update
   * add 3d background
   * nicer button
 * code should be cleaned up alot
   * more things should be put in different funcions
   * cleaner code
   * split into different files for different things
 * support should be added for remotely editing files like in cloudcatcher, it should also allow you to run code while the remote control is running in the background allowing for you to use it while having other things running, this would be extra helpful as it would let you check on how programs are doing.
 * add when you hold mouse over a block display it
 * add location and direction saving and loading information for the turtle so it can save it after restart.
 * client software should retry and start a new connection instead of restart whole computer on websocket failure.
 * look into why in the website the X cord position has to be swapped to make blocks appear in the right direction.
 add a fuel display to the screen. Along with a button to refuel.
 * design a custom logo for this project, add to the website as favicon as well as github page.
 * replace the arrow for the turtle with a 3d model of turtle.
 * look into smarter ways for websites to get data on all the different blocks there are instead of individual http requests.
 * add a system to move the turtle without really moving turtle incase they go out of sync and isn't where you think it is.
 * add a custom code input field where you can add custom code that runs in the background, should also have a system that keeps the server up to date with when it moves and what it's x y and z pos is along with blocks around it.
 * website should have a mode to make blocks transparent so you can see in caves and what not.
 * render engine rewrite
   * custom render engine for blocks, reads minecraft database files and extracts images, supports custom blocks like fences, as well as supporting blockstates for things like when redstone is active as well as rotation.
   * smart system for rendering blocks that only renders the faces that you can see, that way it lowers by a lot the amount of triangles being display'd and stops lag, worth looking into as well if this is really the best way todo it or if three.js has a better way of doing this. 
   * possibly might add support for rendering entities so it can be supported by some peripherals.
 * more edgecase catching on the client side (turtle), including things like when server has http and/or websockets disabled.
 * feature for turtle to tell server where it really is based on gps, that way there is no relying on this crappy system for getting location.
 * replicate option that goes through, crafts a new turtle and sets it up for you so you don't have to do it.
 * improve security of the system as there is not really much at the moment.
   * maybe could do turtle requests AES key with RSA code for server and server gives aes code and they talk using that.
   * also should secure website end as that is accessible by anyone atm that can access the port it is hosted on, which is the same one as websocket. 
 * add support for some peripheral's.
   * peripheral that gets where blocks from advanced peripherals  
   * peripheral that gets where ores are from advanced peripherals
   * really just most of advanced peripherals stuff would be nice to add support for.
   * modem peripheral so can interact with other computers
   * disk peripheral
   * display peripheral
   * speaker peripheral
 * add support for managing and controlling inventories, such as taking items in and out of chests or other turtles.
   * also should support crafting items.
 * custom code idea's.
   * smart auto mine.
     * should support all the different things needed inorder to remake a turtle.
     * should be able to strip mine knowing what it wants and best ore level, should be able to mine a whole ore vein and then return to where it was.
     * maybe even a system that gets world seed to know where the closet ores are.
 * if failed to move because of no fuel display message about that
 * add on screen popup's for less important things that way I dont have todo full screen annoying popup's 
 * add logo for program
 * progress bar for movements that are happening so you can get updates
 * setting to controll what level of logging (ideally a .env file or something of the sort)
 * move arrow back abit so it doesn't go into block infront
 * make the arrow a arrow sticking out a block instead
 * ways to resync turtle after desync
 * turtle should not stop terminate command
 * holding mouse over blocks should say what block it is
 * inventory controll of turtle
 * new ui for turtle
   * server latancy
   * debug tab
 * move system for storing block cords over to arrays
 * after refueling instently update fuel level (same for movement)
 * move code over to typescript
 * more stuff should be put into the genreal update api call
 * look at if it is worth using built in cc twaeked computer id instead of using file saved on drive
 * orbit camera around current turtle selected
 * red outline on currently selected turtle
 * find a way to bring back parral downloads and still have loading screen
 * change turtle connected prompt to be more clear it means in past or currently not just currently.
 * make it clear when a turtle is connected or not.
 * convert it over from a website to be a program that it opens
 * change color based on block
 * add name to controlled turtle
 * click to controll turtle
 * break and move should have buttons to control
 * write using signs
 * look into why having more then 1 tab open of this app causes problems
 * pop up windows for turtles that allows you to run commands on them
