import { VerbTense } from './verb-tense.model';
import { VerbDrillRecord } from './verb-drill-record.model';
import { LanguageUtils } from 'src/app/language-utils';

export class VerbSet {

    public isSelected: boolean;

    constructor(
        public _id?: string,
        public eng_text?: string,
        public eng_audio?: string,
        public a_audio_base?: string,
        public status?: string,
        public a_pres_text?: VerbTense,
        public a_past_text?: VerbTense,
        public everPracticed?: boolean,
        public lastPracticed?: string,
        public drillRecord?: VerbDrillRecord
    ) {
        this.isSelected = false;
    }

    getArabicText(index: number): string {
        let pronounIndex = index % 8;
        let pronoun = LanguageUtils.engKeys[pronounIndex];
        if (index < 8) {
            return this.a_pres_text[pronoun];
        } else {
            return this.a_past_text[pronoun];
        }
    }

    getArabicAudio(index: number): string {
        let pronounIndex = index % 8;
        let pronoun = LanguageUtils.engKeys[pronounIndex];
        let tense = (index < 8) ? 'pres' : 'past';
        return `verbs/arabic/_${this.a_audio_base}_${pronoun}-${tense}.mp3`;
    }

}