import { FlashcardStatus } from './flashcard-status.model';

export class FlashcardRound {
    constructor(private flashcards: FlashcardStatus[]){ }

    updateChildStatus(id: string, status: string) {
        let index = this.flashcards.findIndex(f => f.id === id);
        if (index == -1) {
            console.error('flashcard id not found');
            return
        }
        if ((status === 'correct') && (this.flashcards[index].status === 'mastered')) {
            this.flashcards[index].status = 'mastered-correct';
        } else {
            this.flashcards[index].status = status;
        }   
    }

    getChildStatus(id: string): string {
        let index = this.flashcards.findIndex(f => f.id === id);
        if (index == -1) {
            console.error('flashcard id not found');
            return
        }
        return this.flashcards[index].status;
    }
}