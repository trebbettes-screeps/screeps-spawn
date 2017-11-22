declare module "screeps-spawn" {
    function generateBody(room: Room, segment: string[], options?: GenerateBodyOptions): string[];
    function getCreeps(id: string, includeSpawning?: boolean): Creep[];
    function getCreepCount(id: string): number;
    function hasCreeps(id: string): boolean;
    function registerSpawnRequest(id: string, room: Room, spawnRequest: SpawnRequestor): void;
    function setTimerCycle(id: string, cycleModifier?: number): void;
    function setTimer(id: string, ticks: number): void;
    function spawnTimerCheck(id: string): boolean;
    function processSpawnRequests(): void;
}

interface SpawnRequestor {
    canSpawn: (id: string, room: Room) => boolean;
    generateSpawnRequest: (id: string, room: Room) => SpawnRequest;
    shouldSpawn: (id: string, room: Room) => boolean;
}

interface SpawnRequestMemory {
    lastSpawn: number;
    creeps?: string[];
    timer?: number;
}

interface Memory {
    __spawn: {[spawnId: string]: SpawnRequestMemory | undefined};
}

interface SpawnRequest {
    body: string[];
    memory?: any;
    name?: string;
    onSuccess?: (name: string) => void;
}

interface GenerateBodyOptions {
    maxCost?: number;
    maxSize?: number;
    moveShield?: boolean;
    additionalSegment?: string[];
    sortOrder?: {
        [part: string]: number;
    };
}
