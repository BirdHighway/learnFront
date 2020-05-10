export class SimpleAudioObject {

    filePath: string;
    delay: number;
    flag: string;

    constructor(
        filePath: string,
        delay: number,
        flag = ''
    ) {
        this.filePath = filePath;
        this.delay = delay * 1000;
        this.flag = flag;
    }
}