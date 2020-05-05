export class VerbFormChoice {

    public isSelected;

    constructor(
        public tense: string,
        public arabicPronoun: string,
        public formIndex: number,
    ) {
        this.isSelected = false;
    }
}