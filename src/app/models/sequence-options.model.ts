export interface SequenceOptions {
    playCountA: number;
    playCountB: number;
    betweenA: number;
    beforeAnswer: number;
    betweenB: number;
    sourcesA: string[];
    sourcesB: string[];
    directionAB: boolean;
    autoAdvanceOnComplete: boolean;
}