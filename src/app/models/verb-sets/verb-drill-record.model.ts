import { VerbTenseRecord } from './verb-tense-record.model';

export class VerbDrillRecord {

    private past: VerbTenseRecord;
    private present: VerbTenseRecord;

    constructor() {
        this.past = {
            tense: 'past',
            he: [],
            i: [],
            she: [],
            they: [],
            we: [],
            you_female: [],
            you_male: [],
            you_plural: []
        }
        this.present = {
            tense: 'present',
            he: [],
            i: [],
            she: [],
            they: [],
            we: [],
            you_female: [],
            you_male: [],
            you_plural: []
        }
    }

    addRecord(tense: string, person: string, value: boolean) {
        if (tense === 'past') {
            this.past[person].push(value);
        } else if (tense === 'present') {
            this.present[person].push(value);
        }
    }

}