import { QueueObject } from './queue-object.model';

export interface AudioPlayerStatus {
    message: string;
    log?: string[];
    isPlaying?: boolean;
    progress?: number;
    data?: any;
    autoAdvance?: boolean;
}