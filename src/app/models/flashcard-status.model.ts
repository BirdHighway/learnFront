export class FlashcardStatus {

    id: string;
    status: string;

    constructor(
        id: string
    ) {
        this.id = id;
        this.status = 'initial';
    }
}