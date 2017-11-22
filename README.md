# Screeps Spawn

*screeps-spawn* is a simple spawn manager for [Screeps](http://www.screeps.com).

It comes with a creep body generator and a number of tools to manage spawning and access to creep sets.

- Spawn Timer
- Cycle Timer 
- Body Generator
- Creep Access

For each spawn request you must provide a uniqueId, a room to spawn from and a configuration object.

The configuration object has 3 methods: `shouldSpawn`, `canSpawn` and `generateSpawnRequest`.

Spawn Priority: is based purley upon the position in which the spawn requests appear within your code.
Spawn requests created first will have a higher priority.

Every 3 ticks the spawnRequests are evaluated for each spawn room:  

1. Find the first spawn request which `shouldSpawn()`.
2. If `canSpawn()` then `generateSpawnRequest()` will be called.

Because of this, your logic inside `shouldSpawn` should be as light as possible.
As this is potentially called every 3 ticks. 
You can make use of the timers and helper functions to achieve this as demonstrated below.

## Install:
Install via NPM in your local dev environment `npm install screeps-spawn`.

Or if you are using the screeps client then create a new module called 'screeps-spawn' and 
copy the contents of this file into it.

## Usage
Import the module in your `main` file. (At the top outside the loop)

JavaScript: 

```
const $ = require("screeps-spawn");
```

TypeScript: 

```
import * as $ from "screeps-spawn";
``` 

> You can rename the module to anything you like if you dont want to use `$`;

> At the bottom of your main loop you will need to call `$.processSpawnRequests()`. It is **important** that this is called after all your spawn requests have been generated.



## Methods:


```
// Register Spawn Requests.
$.registerSpawnRequest(id, room, config);
 
// Generate Bodies
$.generateBody(room, segment, options?);
 
// Creep Access 
$.getCreepCount(id);
$.getCreeps(id);
$.hasCreeps(id);
 
// Timers
$.setTimer(id, ticksFromNow);
$.setTimerCycle(id, numberOfCreeps);
$.spawnTimerCheck(id);
 
// Process all spawn requests.
$.processSpawnRequests();
```

#### getCreeps(id, includeSpawning?)
> By default this will exclude spawning creeps.

- id: The spawn request id.
- includeSpawning: Optional - Default `false`.


#### generateBody(room, segment, options?)
- room: The room to spawn from.
- segment: An array of body part constants to repeat.
- options: Object 
```
const optionsExample = {
    maxCost: 2000,                      // The maximum ammount of spawn energy to use.
    maxSize: 20,                        // The maximum number of body parts to spawn.
    moveShield: true,                   // Position MOVE parts at the front of the creep. (used with default sort)
    additionalSegment: [WORK, MOVE],    // An additional segment that gets added once to the body.
    sortOrder?: {                       // A custom sort object. 'other' is used for parts not specified.
        [WORK]: 1,
        other: 2,
        [CARRY]: 3
    },
}
```

#### setTimerCycle(id, numberCreeps?)
Sets timer to `CREEP_LIFE_TIME / numberOfCreeps`

- id: The spawnRequest id.
- numberCreeps: Optional - The number of creeps to spawn (default 1).

#### setTimer(id, ticksFromNow)
Sets timer to `Game.time + ticksFromNow`

- id: The spawnRequest id.
- ticksFromNow: The number of ticks in the future to set the spawn timer to.

#### registerSpawnRequest(id, room, config)
Register a spawn request to be managed.
##### Examples:
> Spawn a scout every 1500 ticks.

```ecmascript 6
// import or require screeps-spawn here.
 
function scoutFromRoom(room) {
  const taskId = `${room.name}_scout`; // Unique ID.
 
  $.registerSpawnRequest(taskId, room, {
    shouldSpawn: $.spawnTimerCheck,
    canSpawn: () => room.energyAvailable > 50,
    generateSpawnRequest: () => ({
      body: $.generateBody(room, [MOVE], {maxSize: 1}),
      onSuccess: $.setTimerCycle, // Defaults to 1 creep
    }),
  });
 
  const creeps = $.getCreeps(taskId);
   
  _.forEach(creeps, scout);
}
 
function scout(creep) {...}
```

> Spawn 3 builder creeps on an immediate spawn.  
```ecmascript 6
$.registerSpawnRequest(taskId, room, {
    shouldSpawn: () => $.getCreepCount(taskId) < 3,
    canSpawn: () => room.energyAvailable > 2000 || room.energyAvailable === room.energyCapacityAvailable,
    generateSpawnRequest: () => ({
        body: $.generateBody(room, [MOVE, WORK, CARRY], {maxCost: room.energyAvailable}), 
    }),
});
```

> One Creep every 10,000 ticks.
```ecmascript 6
$.registerSpawnRequest(taskId, room, {
    shouldSpawn: () => $.spawnTimerCheck, 
    canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
    generateSpawnRequest: () => ({
        body: $.generateBody(room, [MOVE, WORK, CARRY]), 
        onSuccess: () => $.setTimer(taskId, 10000),
    }),
});
```

> Spawn scaled haulers for a source.

```ecmascript 6
// import or require screeps-spawn here.
 
function sendHaulers(room, source) {
    const taskId = `hauler_${room.name}_${source.id}`;
    
    $.registerSpawnRequest(taskId, room, {
        shouldSpawn: () => $.spawnTimerCheck,
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => generateSpawnRequest(taskId, room, source),
    });
    
    const haulers = $.getCreeps(taskId);
    
    _.forEach(haulers, haul);
}
 
function generateSpawnRequest(taskId, room, source) {
    const analysis = haulerAnalysis(room, source);
    
    return {
        body: $.generateBody(room, [CARRY, CARRY, MOVE], {maxCost: analysis.maxCostPerCreep}),
        onSuccess: () => $.setTimerCycle(taskId, analysis.targetCreeps),
    };
}
 
function haulerAnalysis(room, source) {
    const pathLength = room.storage ? PathFinder.search(room.storage.pos, {pos: source.pos, range: 1}).path.length : 25;
    const carryPartsRequired = Math.ceil(source.energyCapacity / 300 * pathLength * 2 / 50 * 1.2);
    const maxCarryParts = Math.floor(room.energyCapacityAvailable / BODYPART_COST[CARRY] * 0.666);
    const ratio = carryPartsRequired / maxCarryParts;
    const energyModifier = ratio <= 1 ? ratio : ratio / Math.ceil(ratio);
    
    return {
        targetCreeps: ratio <= 1 ? 1 : Math.min(Math.ceil(ratio), 5),
        maxCostPerCreep: Math.ceil(room.energyCapacityAvailable * energyModifier),
    };
}
 
function haul(creep) {...}
```