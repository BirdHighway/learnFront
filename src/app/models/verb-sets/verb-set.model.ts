import { VerbTense } from './verb-tense.model';

export class VerbSet {

    constructor(
        public _id?: string,
        public eng_text?: string,
        public eng_audio?: string,
        public a_audio_base?: string,
        public status?: string,
        public a_pres_text?: VerbTense,
        public a_past_text?: VerbTense,
        public everPracticed?: boolean,
        public lastPracticed?: string
    ) { }

}