module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 1);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const skipSpawn = () => Game.time % 3 !== 0;
let lastRun = 0;
function processSpawnRequests() {
    if (skipSpawn() || lastRun === Game.time) {
        return;
    }
    lastRun = Game.time;
    const spawnSets = _(Game.spawns)
        .filter((spawn) => spawn.isActive() && !spawn.spawning && getManagersFromCache(spawn.room))
        .groupBy((spawn) => spawn.pos.roomName)
        .map((spawns) => ({
        managers: getManagersFromCache(spawns[0].room),
        room: spawns[0].room,
        spawns,
    })).value();
    _.forEach(spawnSets, (set) => spawnCycle(set.room, set.spawns, set.managers));
}
exports.processSpawnRequests = processSpawnRequests;
function spawnCycle(room, spawns, managers) {
    const result = _.find(managers, (mng, id) => trySpawnAttempt(id, mng, room, spawns[0]));
    if (!result) {
    }
}
function trySpawnAttempt(managerId, manager, room, spawn) {
    try {
        return spawnAttempt(managerId, manager, room, spawn);
    }
    catch (e) {
        console.log(`screeps-spawn: Unexpected spawn failure: ${room.name} | ${managerId}`);
        console.log(JSON.stringify(e.stack, null, 4));
        return false;
    }
}
function spawnAttempt(managerId, manager, room, spawn) {
    if (!manager.shouldSpawn(managerId, room)) {
        return false;
    }
    if (!manager.canSpawn(managerId, room)) {
        return room.energyAvailable !== room.energyCapacityAvailable;
    }
    const request = manager.generateSpawnRequest(managerId, room);
    const name = request.name || `${managerId}_${Math.random().toString(36).slice(2, 6)}`;
    const memory = request.memory || {};
    _.defaults(memory, { origin: room.name });
    const spawnResult = spawn.spawnCreep(request.body, name, { memory });
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
function registerCreep(id, name) {
    Memory.__spawn[id] = Memory.__spawn[id] || { lastSpawn: 0 };
    const mem = Memory.__spawn[id];
    if (mem.creeps && mem.creeps.length) {
        mem.lastSpawn = Game.time;
        mem.creeps = _.filter(mem.creeps, (n) => Game.creeps[n]);
        mem.creeps.push(name);
    }
    else {
        mem.creeps = [name];
    }
}
function getCreeps(id, includeSpawning = false) {
    const creeps = creepsFromCache(id);
    return includeSpawning ? creeps : _.filter(creeps, (c) => !c.spawning);
}
exports.getCreeps = getCreeps;
function getCreepCount(id) {
    return creepsFromCache(id).length;
}
exports.getCreepCount = getCreepCount;
function hasCreeps(id) {
    return getCreepCount(id) > 0;
}
exports.hasCreeps = hasCreeps;
function registerSpawnRequest(id, room, spawnRequest) {
    addManagerToCache(id, room, spawnRequest);
}
exports.registerSpawnRequest = registerSpawnRequest;
let cache = {
    creeps: {},
    managers: {},
    tickReset: Game.time,
};
function checkCache() {
    cache = cache.tickReset === Game.time ? cache : {
        creeps: {},
        managers: {},
        tickReset: Game.time,
    };
}
function creepsFromCache(taskId) {
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
function creepsFromNames(names) {
    return _(names)
        .map((n) => Game.creeps[n])
        .filter(_.identity).value();
}
function addManagerToCache(taskId, room, manager) {
    checkCache();
    cache.managers[room.name] = cache.managers[room.name] || {};
    if (cache.managers[room.name][taskId]) {
        console.log(`screeps-spawn module: duplicate spawn manager with id ${taskId} has not been registered.`);
        return;
    }
    cache.managers[room.name][taskId] = manager;
}
function getManagersFromCache(room) {
    return cache.managers[room.name] || null;
}
const errors = {
    "-1": "ERR_NOT_OWNER",
    "-10": "ERR_INVALID_ARGS",
    "-14": "ERR_RCL_NOT_ENOUGH",
    "-3": "ERR_NAME_EXISTS",
    "-4": "ERR_BUSY",
    "-6": "ERR_NOT_ENOUGH_ENERGY",
    "0": "OK",
};


/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(2);
var generateBody_1 = __webpack_require__(3);
exports.generateBody = generateBody_1.generateBody;
var spawnManagers_1 = __webpack_require__(0);
exports.processSpawnRequests = spawnManagers_1.processSpawnRequests;
exports.registerSpawnRequest = spawnManagers_1.registerSpawnRequest;
exports.getCreepCount = spawnManagers_1.getCreepCount;
exports.getCreeps = spawnManagers_1.getCreeps;
exports.hasCreeps = spawnManagers_1.hasCreeps;
var spawnTimers_1 = __webpack_require__(4);
exports.setTimer = spawnTimers_1.setTimer;
exports.setTimerCycle = spawnTimers_1.setTimerCycle;
exports.spawnTimerCheck = spawnTimers_1.spawnTimerCheck;


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const spawnManagers_1 = __webpack_require__(0);
console.log("screeps-spawn: init");
Memory.__spawn = Memory.__spawn || {};
for (const id in Memory.__spawn) {
    if (Memory.__spawn[id]) {
        const data = Memory.__spawn[id];
        if (spawnManagers_1.getCreeps(id, true).length === 0 && (!data.timer || data.timer < Game.time - 1500)) {
            Memory.__spawn[id] = undefined;
        }
    }
}


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function generateBody(room, segment, options = {}) {
    const numberOfSegments = segmentsRequired(room, segment, options);
    const segments = new Array(numberOfSegments).fill(segment);
    if (options.additionalSegment) {
        segments.push(options.additionalSegment);
    }
    const sortOrder = options.sortOrder || { [TOUGH]: 1, other: 3, [HEAL]: 4, [MOVE]: options.moveShield ? 2 : 5 };
    return _.sortBy(_.flatten(segments), (part) => sortOrder[part] || sortOrder.other || 99);
}
exports.generateBody = generateBody;
function segmentsRequired(room, segment, opts) {
    return Math.min(maxSegmentsByCost(room, segment, opts), maxSegmentsBySize(segment, opts));
}
function maxSegmentsByCost(room, segment, opts) {
    let maxCost = opts.maxCost && opts.maxCost <= room.energyCapacityAvailable ?
        opts.maxCost : room.energyCapacityAvailable;
    maxCost = opts.additionalSegment ? maxCost - _.sum(opts.additionalSegment, getPartCost) : maxCost;
    return Math.floor(maxCost / _.sum(segment, getPartCost));
}
function maxSegmentsBySize(segment, opts) {
    let maxSize = opts.maxSize && opts.maxSize <= MAX_CREEP_SIZE ? opts.maxSize : MAX_CREEP_SIZE;
    maxSize = opts.additionalSegment ? maxSize - opts.additionalSegment.length : maxSize;
    return Math.floor((maxSize && maxSize <= 50 ? maxSize : MAX_CREEP_SIZE) / segment.length);
}
function getPartCost(type) {
    return BODYPART_COST[type];
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
function setTimerCycle(spawnId, cycleModifier = 1) {
    Memory.__spawn[spawnId] = Memory.__spawn[spawnId] || { lastSpawn: 0 };
    const ticksTillNextSpawn = Math.floor(CREEP_LIFE_TIME / cycleModifier);
    Memory.__spawn[spawnId].timer = Game.time + ticksTillNextSpawn;
}
exports.setTimerCycle = setTimerCycle;
function setTimer(spawnId, ticks) {
    Memory.__spawn[spawnId] = Memory.__spawn[spawnId] || { lastSpawn: 0 };
    Memory.__spawn[spawnId].timer = Game.time + ticks;
}
exports.setTimer = setTimer;
function spawnTimerCheck(spawnId) {
    const mem = Memory.__spawn[spawnId];
    if (!mem || !mem.timer) {
        return true;
    }
    return Game.time >= mem.timer;
}
exports.spawnTimerCheck = spawnTimerCheck;


/***/ })
/******/ ]);