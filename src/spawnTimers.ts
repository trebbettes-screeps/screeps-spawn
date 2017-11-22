export function setTimerCycle(id: string, cycleModifier: number = 1): void {
    Memory.__spawn[id] = Memory.__spawn[id] || {lastSpawn: 0};
    const ticksTillNextSpawn = Math.floor(CREEP_LIFE_TIME / cycleModifier);
    Memory.__spawn[id]!.timer = Game.time + ticksTillNextSpawn;
}

export function setTimer(id: string, ticks: number): void {
    Memory.__spawn[id] = Memory.__spawn[id] || {lastSpawn: 0};
    Memory.__spawn[id]!.timer = Game.time + ticks;
}

export function spawnTimerCheck(id: string): boolean {
    const mem = Memory.__spawn[id];
    if (!mem || !mem.timer) {
        return true;
    }
    return Game.time >= mem.timer;
}
