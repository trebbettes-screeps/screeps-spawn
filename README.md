# Screeps Spawn

*screeps-spawn* is a simple spawn manager for [Screeps](http://www.screeps.com).

Special thanks to some members of SUN!

**Documentation** can be found [HERE](https://trebbettes-screeps.github.io/screeps-spawn/)

Features:
- Spawn Timers
- Body Generator
- Easy creep access.

How it works:

For each `spawn request` you must provide a uniqueId, a room to spawn from and a configuration object.
The configuration object has 3 functions `shouldSpawn`, `canSpawn` and `generateSpawnRequest` that control the flow of the spawns.

`shouldSpawn` and `canSpawn` should be as light as possible and any CPU intensive code should be in `generateSpawnRequest`.

When you generate a spawn request you can provide an `onSuccess` method that will allow you to set the relevant spawn timers. Or perform over custom actions.

Spawn Requests are processed every 3 ticks.

**Spawn Priority:** is based purely upon the position in which the spawn requests appear within your code.
If a spawn request `shouldSpawn` but it cant `canSpawn` then spawning will be paused until that request is satisfied (or the room is full).
Spawn requests created first will have a higher priority.

## Install:
Install via NPM in your local dev environment `npm install screeps-spawn`.

Or if you are using the screeps client then create a new module called 'screeps-spawn' and 
copy the contents of [this](https://github.com/trebbettes-screeps/screeps-spawn/blob/master/dist/spawn.js) file into it.

Import the module whenever you need to use it.

JavaScript: 

```
const $ = require("screeps-spawn");
```

TypeScript: 

```
import * as $ from "screeps-spawn";
``` 

You can rename the module to anything you like if you dont want to use `$`;

#### Important!

You must call `processSpawnRequests()` somewhere in your code *after* having generated your spawnRequests.
```typescript
const $ = require("screeps-spawn");
 
module.exports = {
    loop: function () {
       // run all your code.
       superAi();
       
       // then process the requests.
       $.processSpawnRequests();
    }
}
```




## Usage & Examples:
> Spawn 1 scout every 1500 ticks.

```typescript
const $ = require("screeps-spawn");
 
function scoutFromRoom(room) {
  const taskId = `${room.name}_scout`; // Unique ID.
 
  $.registerSpawnRequest(taskId, room, {
    shouldSpawn: () => $.spawnTimerCheck(taskId),
    canSpawn: () => room.energyAvailable > 50,
    generateSpawnRequest: () => ({
      body: $.generateBody(room, [MOVE], {maxSize: 1}),
      onSuccess: () => $.setTimerCycle(taskId),
    }),
  });
 
  const creeps = $.getCreeps(taskId);
   
  _.forEach(creeps, scout);
}
 
function scout(creep) {...}
```

> Spawn 1 builder every 500 ticks (3 builders).

```typescript

const $ = require("screeps-spawn");
 
function supplyBuilders(room) {
    const taskId = `${room.name}_builders`; // Unique ID.
 
    $.registerSpawnRequest(taskId, room, {
        shouldSpawn: () => $.spawnTimerCheck(taskId),
        canSpawn: () => room.energyAvailable >= 2000 || room.energyAvailable === room.energyCapacityAvailable,
        generateSpawnRequest: () => ({
            body: $.generateBody(room, [MOVE, WORK, CARRY], {maxCost: Math.min(room.energyAvailable, 2000)}),
            onSuccess: () => $.setTimerCycle(taskId, 3) 
        }),
    });
 
    const creeps = $.getCreeps(taskId);
   
    _.forEach(creeps, build);
}
 
function build(creep) {...}
```

> One Creep every 10,000 ticks.

```typescript
$.registerSpawnRequest(taskId, room, {
    shouldSpawn: () => $.spawnTimerCheck(taskId), 
    canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
    generateSpawnRequest: () => ({
        body: $.generateBody(room, [MOVE, WORK, CARRY]), 
        onSuccess: () => $.setTimer(taskId, 10000),
    }),
});
```

> Always 3 Creeps (immediate spawn on death).

```typescript
$.registerSpawnRequest(taskId, room, {
    shouldSpawn: () => $.getCreepCount(taskId) < 3, 
    canSpawn: () => room.energyAvailable === room.energyCapacityAvailable,
    generateSpawnRequest: () => ({
        body: $.generateBody(room, [MOVE, WORK, CARRY]), 
    }),
});
```

> Spawn scaled haulers for a source.

```typescript
const $ = require("screeps-spawn");
 
function sendHaulers(room, source) {
    const taskId = `hauler_${room.name}_${source.id}`;
    
    $.registerSpawnRequest(taskId, room, {
        shouldSpawn: () => $.spawnTimerCheck(taskId),
        canSpawn: () => room.energyCapacityAvailable === room.energyAvailable,
        generateSpawnRequest: () => {
            const analysis = haulerAnalysis(room, source);
            return {
                body: $.generateBody(room, [CARRY, CARRY, MOVE], {maxCost: analysis.maxCostPerCreep}),
                onSuccess: () => $.setTimerCycle(taskId, analysis.targetCreeps),
            }
        }
    });
    
    const haulers = $.getCreeps(taskId);
    
    _.forEach(haulers, haul);
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