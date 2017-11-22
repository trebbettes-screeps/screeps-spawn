import {getCreeps} from "./spawnManagers";

console.log("screeps-spawn: init");

Memory.__spawn = Memory.__spawn || {};

for (const id in Memory.__spawn) {
    if (Memory.__spawn[id]) {
        const data = Memory.__spawn[id]!;
        if (getCreeps(id, true).length === 0 && (!data.timer || data.timer < Game.time - 1500)) {
            Memory.__spawn[id] = undefined;
        }
    }
}
