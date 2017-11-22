/**
 * Generate a body given a room to spawn from and a segment to repeat.
 * By default it generate as big a creep as it can. Set `maxCost` and `maxSize` options to configure this.
 * ```typescript
 * interface GenerateBodyOptions {
 *  maxCost?: number;
 *  maxSize?: number;
 *  moveShield?: boolean;           // Place move parts at the front.
 *  additionalSegment?: string[];   // An additional not repeated segment.
 *  sortOrder?: {                   // Override the default sorting
 *      [partConstant: string]: number;
 *      other: number;
 *  };
 * }
 * ```
 */
export function generateBody(room: Room, segment: string[], options: GenerateBodyOptions = {}): string[] {
    const numberOfSegments = segmentsRequired(room, segment, options);
    const segments = new Array(numberOfSegments).fill(segment);
    if (options.additionalSegment) {
        segments.push(options.additionalSegment);
    }
    const sortOrder: {[part: string]: number} =
        options.sortOrder || {[TOUGH]: 1, other: 3, [HEAL]: 4, [MOVE]: options.moveShield ? 2 : 5};
    return _.sortBy(_.flatten(segments), (part: string) => sortOrder[part] || sortOrder.other || 99);
}

function segmentsRequired(room: Room, segment: string[], opts: GenerateBodyOptions): number {
    return Math.min(maxSegmentsByCost(room, segment, opts), maxSegmentsBySize(segment, opts));
}

function maxSegmentsByCost(room: Room, segment: string[], opts: GenerateBodyOptions) {
    let maxCost = opts.maxCost && opts.maxCost <= room.energyCapacityAvailable ?
        opts.maxCost : room.energyCapacityAvailable;

    maxCost = opts.additionalSegment ? maxCost - _.sum(opts.additionalSegment, getPartCost) : maxCost;
    return Math.floor(maxCost / _.sum(segment, getPartCost));
}

function maxSegmentsBySize(segment: string[], opts: GenerateBodyOptions): number {
    let maxSize = opts.maxSize && opts.maxSize <= MAX_CREEP_SIZE ? opts.maxSize : MAX_CREEP_SIZE;
    maxSize = opts.additionalSegment ? maxSize - opts.additionalSegment.length : maxSize;
    return Math.floor((maxSize && maxSize <= 50 ? maxSize : MAX_CREEP_SIZE) / segment.length);
}

function getPartCost(type: string): number {
    return BODYPART_COST[type];
}
