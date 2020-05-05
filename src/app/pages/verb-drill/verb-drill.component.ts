import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';
import { IdDrillOptions } from 'src/app/models/verb-sets/id-drill-options.model';
import { IdDrillData } from 'src/app/models/verb-sets/id-drill-data.model';
import { LanguageUtils } from 'src/app/language-utils';
import { AudioPlayerStatus } from 'src/app/models/audio-player-status.model';
import { VerbFormChoice } from 'src/app/models/verb-sets/verb-form-choice.model';

@Component({
    selector: 'app-verb-drill',
    templateUrl: './verb-drill.component.html',
    styleUrls: ['./verb-drill.component.scss']
})
export class VerbDrillComponent implements OnInit {

    showOptions: boolean;
    showMain: boolean;
    verbs: VerbSet[];
    drillType: string;
    drillMaterial: string;
    counter: number;
    focusVerb: VerbSet;
    focusDrill: IdDrillData;
    allowAdvance: boolean;
    history: IdDrillData[];
    optionHistory: IdDrillOptions[];
    showDebug: boolean;

    pastTenseChoices: VerbFormChoice[];
    presTenseChoices: VerbFormChoice[];

    guessedVerb: VerbSet;
    guessedForm: number;

    default = {
        'playCountA': 2,
        'betweenA': 1.5,
        'beforeB': 3,
        'betweenB': .1,
        'playCountRepeatA': 1,
        'beforeRepeat': .25,
        'beforeNextSequence': 1
    };

    audioPlayerStatus: AudioPlayerStatus;

    // subs
    verbSub;
    statusSub;
    lastTimeout;

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) {
        this.showOptions = true;
        this.showMain = false;
        this.showDebug = false;
        this.drillType = 'id-click';
        this.drillMaterial = 'study-verbs';
        this.allowAdvance = true;
        this.counter = 0;
        this.verbs = [];
        this.history = [];
        this.optionHistory = [];
        this.guessedVerb = null;
        this.guessedForm = null;
        this.presTenseChoices = [];
        this.pastTenseChoices = [];
        for (let i=0; i<8; i++) {
            let pres = new VerbFormChoice('present', LanguageUtils.pronouns[i], i);
            this.presTenseChoices.push(pres);
        }
        for (let i=8; i<16; i++) {
            let past = new VerbFormChoice('past', LanguageUtils.pronouns[(i % 8)], i);
            this.pastTenseChoices.push(past);
        }
    }

    ngOnInit() {
        this.statusSub = this.audioPlayer.returnStatusSubject()
            .subscribe(val => {
                this.audioPlayerStatus = val;
                if ((val.message === 'COMPLETE') && this.allowAdvance) {
                    this.lastTimeout = setTimeout(() => {
                        this.nextIdSequence();
                    }, (this.default.beforeNextSequence * 1000));
                } else if (val.message === 'KILL_SEQUENCE') {
                    this.allowAdvance = false;
                    clearTimeout(this.lastTimeout);
                }
            })
    }

    ngOnDestroy() {
        clearTimeout(this.lastTimeout);
        this.audioPlayer.doKillSequence();
        if (this.verbSub) {
            this.verbSub.unsubscribe();
        }
        if (this.statusSub) {
            this.statusSub.unsubscribe();
        }
    }

    beginDrill() {
        this.loadVerbs();
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
    }

    stop() {
        this.allowAdvance = false;
        clearTimeout(this.lastTimeout);
        this.audioPlayer.doKillSequence();
    }

    loadVerbs() {
        let queryString = '';
        if (this.drillMaterial === 'study-verbs') {
            // verbs with status of "study"
            queryString = `collectionType=by-status&status=study`;
        } else if (this.drillMaterial === 'entire-set') {
            // all verbs in DB
            queryString = `collectionType=entire-set`;
        } else if (this.drillMaterial === 'ready-verbs') {
            // verbs with status neither "new" nor "hidden"
            queryString = `collectionType=ready`;
        }
        this.verbSub = this.dataSource.getVerbCollection(queryString)
            .subscribe(response => {
                if (response.status === 'success') {
                    response.data.forEach(verbData => {
                        let v = new VerbSet();
                        Object.assign(v, verbData);
                        this.verbs.push(v);
                    });
                    this.verbs.sort((a, b) => {
                        return (a.eng_text < b.eng_text) ? -1 : 1;
                    })
                    this.showMain = true;
                    this.showOptions = false;
                    this.nextIdSequence();
                } else {
                    console.error(response.data);
                }
            })
    }

    nextIdSequence() {
        let count = this.verbs.length;
        let index = Math.floor(Math.random() * count);
        this.focusVerb = this.verbs[index];
        this.indentificationRound();
    }

    indentificationRound() {
        let formIndex = Math.floor(Math.random() * 16);
        let drillData = new IdDrillData(
            this.focusVerb.eng_audio,
            this.focusVerb.eng_text,
            this.focusVerb.a_audio_base,
            this.focusVerb.getArabicText(formIndex),
            formIndex);
        this.focusDrill = drillData;
        this.history.unshift(drillData);
        let options = this.generateIdOPtions(formIndex);
        this.optionHistory.unshift(options);
        console.log(options);
        this.audioPlayer.startIdDrill(options);
    }

    generateIdOPtions(formIndex: number): IdDrillOptions {
        let options = <IdDrillOptions>{
            engAudio: `verbs/english/${this.focusDrill.engAudio}`,
            tenseAudio: this.getTenseAudio(formIndex),
            pronounAudio: this.getPronounAudio(formIndex),
            arabicAudio: this.getArabicAudio(formIndex),
            playCountA: this.default.playCountA,
            betweenA: this.default.betweenA,
            beforeB: this.default.beforeB,
            betweenB: this.default.betweenB,
            playCountRepeatA: this.default.playCountRepeatA,
            beforeRepeat: this.default.beforeRepeat,
            spacerSound: `verbs/english/sound-ding.wav`
        }
        return options;
    }

    getTenseAudio(formIndex: number): string {
        if (formIndex < 8) {
            return `verbs/english/${LanguageUtils.engAudioTenses[0]}`;
        } else {
            return `verbs/english/${LanguageUtils.engAudioTenses[1]}`;
        }
    }

    getPronounAudio(formIndex: number): string {
        let index = formIndex % 8;
        return `verbs/english/${LanguageUtils.arabicAudioPronouns[index]}`;
    }

    getArabicAudio(formIndex: number): string {
        let tense = (formIndex < 8) ? 'pres' : 'past';
        let index = formIndex % 8;
        return `verbs/arabic/_${this.focusVerb.a_audio_base}_${LanguageUtils.engKeys[index]}-${tense}.mp3`;
    }

    guessThisVerb(verb: VerbSet) {
        this.verbs.forEach(v => {
            v.isSelected = false;
        })
        verb.isSelected = true;
        this.guessedVerb = verb;
    }

}
