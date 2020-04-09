import { Environment } from '../environment';

export class AudioObject {
    
    filePath: string;
    delay: number;
    fullSrc: string;
    totalLength: number;
    index: number;

    constructor(
        filePath: string,
        delay: number,
        index: number
    ) {
        this.filePath = filePath;
        this.delay = delay * 1000;
        this.fullSrc = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/vocab_audio/${filePath}`;
        this.totalLength = 1;
        this.index = index;
    }
}