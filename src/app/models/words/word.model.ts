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

    audioSourcesA(): string[] {
        switch(this.type) {
            case 'noun':
                return [this.eng_audio];
            case 'verb':
                return [this.eng_audio];
            case 'adjective':
                return [this.eng_audio];
            case 'other':
                return [this.eng_audio];
            default:
                return [this.eng_audio];
        }
        
    }

    audioSourcesB(): string[] {
        let sources = [];
        switch(this.type) {
            case 'noun':
                if (this.data_noun.a_sing_audio && this.data_noun.a_sing_audio.length) {
                    sources.push(this.data_noun.a_sing_audio);
                }
                if (this.data_noun.a_pl_audio && this.data_noun.a_pl_audio.length) {
                    sources.push(this.data_noun.a_pl_audio);
                }
                break;
            case 'verb':
                if (this.data_verb.a_past_3sm_audio && this.data_verb.a_past_3sm_audio.length) {
                    sources.push(this.data_verb.a_past_3sm_audio);
                }
                if (this.data_verb.a_pres_3sm_audio && this.data_verb.a_pres_3sm_audio.length) {
                    sources.push(this.data_verb.a_pres_3sm_audio);
                }
                break;
            case 'adjective':
                if (this.data_adj.a_masc_audio && this.data_adj.a_masc_audio.length) {
                    sources.push(this.data_adj.a_masc_audio);
                }
                if (this.data_adj.a_fem_audio && this.data_adj.a_fem_audio.length) {
                    sources.push(this.data_adj.a_fem_audio);
                }
                if (this.data_adj.a_pl_audio && this.data_adj.a_pl_audio.length) {
                    sources.push(this.data_adj.a_pl_audio);
                }
                break;
            case 'other':
                if (this.data_other.a_word_audio && this.data_other.a_word_audio.length) {
                    sources.push(this.data_other.a_word_audio);
                }
                break;
            default:
                if (this.data_other.a_word_audio && this.data_other.a_word_audio.length) {
                    sources.push(this.data_other.a_word_audio);
                }
                break;
        }
        return sources;
    }
}