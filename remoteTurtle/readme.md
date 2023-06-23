# CC:Remote
CC:Remote is an experimental program used to remotely control and manage CC:Tweaked turtles all from a simple to use 3d ui on your computer. CC:Remote is a project that I have been wanting to create for a long time now, however have only recently got around to making.

## features
 - high reliability.
 - flexibility.
 - little to no reliance on clients (turtles) instead mostly all handled by the server.

## contributing
Contributions are always welcome, no matter how small, such as fixing a minor typo, or a minor bug report or as large as a complete recode of the majority of the codebase. Some of the ways you could contribute include:
 - filing a bug report on the issues tab.
 - suggesting ideas for things that could be changed.
 - fixing a typo.
 - improving our documentation/instructions.
 - cleaning up code or recoding parts of the code. 
 - adding new features.



## Todo
 - code should be cleaned up alot
 - - more things should be put in different funcions
 - - cleaner code
 - - split into different files for different things
 - support should be added for remotely editing files like in cloudcatcher, it should also allow you to run code while the remote control is running in the background allowing for you to use it while having other things running, this would be extra helpful as it would let you check on how programs are doing.
 - add location and direction saving and loading information for the turtle so it can save it after restart.
 - client software should retry and start a new connection instead of restart whole computer on websocket failure.
 - there should be images and videos showing this project in action.
 - look into why in the website the X cord position has to be swapped to make blocks appear in the right direction.
 add a fuel display to the screen. Along with a button to refuel.
 - design a custom logo for this project, add to the website as favicon as well as github page.
 - make the arrow for displaying where the turtle is auto update when you refresh/load the website.
 - finish support for more then 1 turtle being controllable at once.
 - replace the arrow for the turtle with a 3d model of turtle.
 - look into ways to possibly lower latency of messaging standards for the turtle.
 - look into smarter ways for websites to get data on all the different blocks there are instead of individual http requests.
 - when the turtle is moving really fast sometimes blocks don't update on the website end, but do on the server end.
 - improve the queueing system to make sure to play them in order of when the command was sent instead of just randomly.
 - code the system for saving block data to a file/database, should also store information like where turtles are and what not.
 - add a system to move the turtle without really moving turtle incase they go out of sync and isn't where you think it is.
 - add a custom code input field where you can add custom code that runs in the background, should also have a system that keeps the server up to date with when it moves and what it's x y and z pos is along with blocks around it.
 - website should have a mode to make blocks transparent so you can see in caves and what not.
 - custom render engine for blocks, reads minecraft database files and extracts images, supports custom blocks like fences, as well as supporting blockstates for things like when redstone is active as well as rotation.
 - smart system for rendering blocks that only renders the faces that you can see, that way it lowers by a lot the amount of triangles being display'd and stops lag, worth looking into as well if this is really the best way todo it or if three.js has a better way of doing this. 
 - possibly might add support for rendering entities so it can be supported by some peripherals.
 - more edgecase catching on the client side (turtle), including things like when server has http and/or websockets disabled.
 - feature for turtle to tell server where it really is based on gps, that way there is no relying on this crappy system for getting location.
 - peripheral swap, if there are more than 2 peripherals it should know how to swap them for which it needs while it is running. 
 - system to add turtle, requires you to set where it is relative to other turtles so that way it starts in sync.
 - replicate option that goes through, crafts a new turtle and sets it up for you so you don't have to do it.
 - improve security of the system as there is not really much at the moment.
 - - maybe could do turtle requests AES key with RSA code for server and server gives aes code and they talk using that.
 - - also should secure website end as that is accessible by anyone atm that can access the port it is hosted on, which is the same one as websocket. 
 - auto update client if it is running out of date firmware. Most likely done by having server on start calculate sha256 hash of firmware then ask client what the local saved hash is to see if it is out of date then send the update dated over most likely websocket connection, could and most likely will do get request though. Could also do this for server as well by looking on github page and prompting the user it is out of date.
 - look into how i could improve the system for when the server asks for a return value that doesn't exist, as this is a common issue when turtles restart but the server does not.
 - add support for some modded peripheral's.
 - - peripheral that gets where blocks from advanced peripherals  
 - - peripheral that gets where ores are from advanced peripherals
 - - really just most of advanced peripherals stuff would be nice to add support for.
 - add support for managing and controlling inventories, such as taking items in and out of chests or other turtles.
 - - also should support crafting items.
 - custom code idea's.
 - - smart auto mine.
 - - - should support all the different things needed inorder to remake a turtle.
 - - - should be able to strip mine knowing what it wants and best ore level, should be able to mine a whole ore vein and then return to where it was.
 - - - maybe even a system that gets world seed to know where the closet ores are.
 - create better ui for website buttons.
 - if failed to move because of no fuel display message about that
 - turtle move queue should be orderd by date to make more efficient
 - change turtle system so that it handles garbage collection stuff when idle instead of right after running command
 - overhall movement verify system.
 - save block data after server shutdown
 - add system for handling more then one turtle
 - add 3d model for turtle
 - add 3d background
 - add on screen popup's for less important things that way I dont have todo full screen annoying popup's 
 - add logo for program
 - smart move mode that turns as well for displaying where blocks are all around it
 - progress bar for movements that are happening so you can get updates
 - setting to bring back advanced log tracking
 - move arrow back a tad
 - add block to arrow so its clear of distence to and what not
 - ways to resync turtle after desync
 - turtle should not stop terminate command
 - holding mouse over blocks should say what block it is
 - inventory
 - new ui for turtle
 - - server latancy
 - - debug tab
 - move system for storing block cords over to arrays
 - after refueling instently update fuel level (same for movement)
