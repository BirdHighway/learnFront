import { NounWord } from './noun-word.model';
import { VerbWord } from './verb-word.model';
import { AdjectiveWord } from './adjective-word.model';
import { OtherWord } from './other-word.model';
import { WordMembership } from '../word-membership.model';

export class Word {
    constructor(
        public _id?: string,
        public type?: string,
        public created?: string,
        public eng_text?: string,
        public eng_audio?: string,
        public lastPracticed?: string,
        public mastered?: boolean,
        public dialect?: string,
        public source?: string,
        public tags?: string[],
        public memberships?: WordMembership[],
        public data_noun?: NounWord,
        public data_verb?: VerbWord,
        public data_adj?: AdjectiveWord,
        public data_other?: OtherWord,
        public bulkSelected?: boolean,
        public bulkWasSelected?: boolean
    ) { }
}