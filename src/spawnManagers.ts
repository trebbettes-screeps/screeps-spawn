const skipSpawn = () => Game.time % 3 !== 0;
let lastRun = 0;

/**
 * Process all spawn requests. **Must** be called in your code **after** spawn requests have been registered.
 */
export function processSpawnRequests(): void {
    if (skipSpawn() || lastRun === Game.time) {
        return;
    }
    lastRun = Game.time;

    const spawnSets = _(Game.spawns)
        .filter((spawn: Spawn) => spawn.isActive() && !spawn.spawning && getManagersFromCache(spawn.room))
        .groupBy((spawn: Spawn) => spawn.pos.roomName)
        .map((spawns: Spawn[]) => ({
            managers: getManagersFromCache(spawns[0].room),
            room: spawns[0].room,
            spawns,
        })).value();

    _.forEach(spawnSets, (set: any) => spawnCycle(set.room, set.spawns, set.managers));
}

function spawnCycle(room: Room, spawns: Spawn[], managers: {[id: string]: SpawnRequester}): void {
    const result = _.find(managers, (mng: SpawnRequester, id: string) => trySpawnAttempt(id, mng, room, spawns[0]));
    if (!result) {
        // TODO: log spawn idle time.
    }
}

function trySpawnAttempt(managerId: string, manager: SpawnRequester, room: Room, spawn: Spawn): boolean {
    try {
        return spawnAttempt(managerId, manager, room, spawn);
    } catch (e) {
        console.log(`screeps-spawn: Unexpected spawn failure: ${room.name} | ${managerId}`);
        console.log(JSON.stringify(e.stack, null, 4));
        return false;
    }
}

function spawnAttempt(managerId: string, manager: SpawnRequester, room: Room, spawn: Spawn): boolean {
    if (!manager.shouldSpawn(managerId, room)) {
        return false;
    }
    if (!manager.canSpawn(managerId, room)) {
        // Skip request if canSpawn is false and the room is at capacity.
        return room.energyAvailable !== room.energyCapacityAvailable;
    }
    const request = manager.generateSpawnRequest(managerId, room);
    const name = request.name || `${managerId}_${Math.random().toString(36).slice(2, 6)}`;
    const memory = request.memory || {};
    _.defaults(memory, {origin: room.name});

    const spawnResult = spawn.spawnCreep(request.body, name, {memory});
    if (spawnResult === OK) {
        if (request.onSuccess) {
            request.onSuccess(managerId, name);
        }
        registerCreep(managerId, name);
        return true;
    }
    console.log(`screeps-spawn: Unexpected spawn failure: ${room.name} | ${managerId} | ${errors[spawnResult]}`);
    return false;
}

function registerCreep(id: string, name: string): void {
    Memory.__spawn[id] = Memory.__spawn[id] || {lastSpawn: 0};
    const mem = Memory.__spawn[id]!;
    if (mem.creeps && mem.creeps.length) {
        mem.lastSpawn = Game.time;
        mem.creeps = _.filter(mem.creeps, (n: string) => Game.creeps[n]);
        mem.creeps.push(name);
    } else {
        mem.creeps = [name];
    }
}

/**
 * Get the creeps that are assigned to the spawn request.
 * By default spawning creeps are excluded.
 */
export function getCreeps(id: string, includeSpawning: boolean = false): Creep[] {
    const creeps = creepsFromCache(id);
    return includeSpawning ? creeps : _.filter(creeps, (c: Creep) => !c.spawning);
}

/**
 * Get the total creep count (including spawning creeps) for a spawn request.
 */
export function getCreepCount(id: string): number {
    return creepsFromCache(id).length;
}

/**
 * Check if a spawn request has at least one creep spawning or alive.
 */
export function hasCreeps(id: string): boolean {
    return getCreepCount(id) > 0;
}

/**
 * Register a spawn request.
 * Requies a unique id, room to spawn from and a SpawnRequester object.
 * ```typescript
 * interface SpawnRequester {
 *  shouldSpawn: () => boolean;
 *  canSpawn: () => boolean;
 *  generateSpawnRequest: () => SpawnRequest;
 * }
 * ```
 * ```typescript
 * interface SpawnRequest {
 *  body: string[];
 *  memory?: any;
 *  name?: string;
 *  onSuccess?: (id: string, name: string) => void;
 * }
 * ```
 */
export function registerSpawnRequest(id: string, room: Room, spawnRequest: SpawnRequester): void {
    addManagerToCache(id, room, spawnRequest);
}

/*
 Cache Per Tick
 */

let cache: {
    creeps: { [taskId: string]: Creep[] },
    managers: { [roomName: string]: { [taskId: string]: SpawnRequester } },
    tickReset: number,
} = {
    creeps: {},
    managers: {},
    tickReset: Game.time,
};

function checkCache(): void {
    cache = cache.tickReset === Game.time ? cache : {
        creeps: {},
        managers: {},
        tickReset: Game.time,
    };
}

function creepsFromCache(taskId: string): Creep[] {
    checkCache();
    if (!cache.creeps[taskId]) {
        const mem = Memory.__spawn[taskId];
        if (!mem || !mem.creeps || !mem.creeps.length) {
            return cache.creeps[taskId] = [];
        }
        cache.creeps[taskId] = creepsFromNames(mem.creeps);
    }
    return cache.creeps[taskId];
}

function creepsFromNames(names: string[]): Creep[] {
    return _(names)
        .map((n: string) => Game.creeps[n])
        .filter(_.identity).value();
}

function addManagerToCache(taskId: string, room: Room, manager: SpawnRequester): void {
    checkCache();
    cache.managers[room.name] = cache.managers[room.name] || {};
    if (cache.managers[room.name][taskId]) {
        console.log(`screeps-spawn module: duplicate spawn manager with id ${ taskId } has not been registered.`);
        return;
    }
    cache.managers[room.name][taskId] = manager;
}

function getManagersFromCache(room: Room): { [taskId: string]: SpawnRequester } | null {
    return cache.managers[room.name] || null;
}

const errors: {[code: string]: string} = {
    "-1": "ERR_NOT_OWNER",
    "-10": "ERR_INVALID_ARGS",
    "-14": "ERR_RCL_NOT_ENOUGH",
    "-3": "ERR_NAME_EXISTS",
    "-4": "ERR_BUSY",
    "-6": "ERR_NOT_ENOUGH_ENERGY",
    "0": "OK",
};
