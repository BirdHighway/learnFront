import { Environment } from '../environment';

export class AudioObject {
    
    filePath: string;
    delay: number;
    fullSrc: string;
    totalLength: number;
    index: number;
    isSideA: boolean;

    constructor(
        filePath: string,
        delay: number,
        index: number,
        isSideA: boolean
    ) {
        this.filePath = filePath;
        this.delay = delay * 1000;
        if (filePath.charAt(0) == 'v') {
            this.fullSrc = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/${filePath}`;
        } else {
            this.fullSrc = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/vocab_audio/${filePath}`;
        }
        this.totalLength = 1;
        this.index = index;
        this.isSideA = isSideA;
    }
}