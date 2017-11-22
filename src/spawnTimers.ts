/**
 * Sets the spawn timer to `Game.time + (CREEP_LIFE_TIME / cycleModifier)`. (default 1)
 */
export function setTimerCycle(spawnId: string, cycleModifier: number = 1): void {
    Memory.__spawn[spawnId] = Memory.__spawn[spawnId] || {lastSpawn: 0};
    const ticksTillNextSpawn = Math.floor(CREEP_LIFE_TIME / cycleModifier);
    Memory.__spawn[spawnId]!.timer = Game.time + ticksTillNextSpawn;
}

/**
 * Sets the spawn timer to N ticks in the future `Game.time + ticks`.
 */
export function setTimer(spawnId: string, ticks: number): void {
    Memory.__spawn[spawnId] = Memory.__spawn[spawnId] || {lastSpawn: 0};
    Memory.__spawn[spawnId]!.timer = Game.time + ticks;
}

/**
 * Check the spawn timer to see if it has passed.
 */
export function spawnTimerCheck(spawnId: string): boolean {
    const mem = Memory.__spawn[spawnId];
    if (!mem || !mem.timer) {
        return true;
    }
    return Game.time >= mem.timer;
}
