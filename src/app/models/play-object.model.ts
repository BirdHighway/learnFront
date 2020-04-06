export class PlayObject {

    private filePath: string;
    private delay: number;

    constructor(
        filePath: string,
        delay: number
    ) {
        this.filePath = 'noun/' + filePath;
        this.delay = delay;
    }

    getFilePath(): string {
        return this.filePath;
    }

    getDelay(): number {
        return this.delay;
    }

    setDelay(delay: number) {
        this.delay = delay;
    }

}