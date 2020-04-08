import { QueueObject } from './queue-object.model';

export interface AudioPlayerStatus {
    title: string;
    isPlaying: boolean;
    progress: number;
    total?: number;
    data?: any;
    queue?: QueueObject[]
}