import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';
import { LanguageUtils } from '../../language-utils';
import { SequenceOptions } from 'src/app/models/sequence-options.model';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { AudioPlayerStatus } from 'src/app/models/audio-player-status.model';
import { ConjugationOptions } from 'src/app/models/conjugation-options';

@Component({
    selector: 'app-study-verbs',
    templateUrl: './study-verbs.component.html',
    styleUrls: ['./study-verbs.component.scss']
})
export class StudyVerbsComponent implements OnInit {

    isLoading = true;
    showMain = false;
    studyDone = false;
    doShowTable = false;
    isAdvancing = false;

    verbs: VerbSet[];
    allVerbs: VerbSet[];

    focusIndex: number;
    focusVerb: VerbSet;

    audioPlayerStatus: AudioPlayerStatus;
    nextCardTimeout;

    focusCardCount: number;
    continueLoop: boolean;
    lastTimeout = null;

    lastRandom: number;
    advanceMethod: string;
    verbForms: number[];
    formIndex: number;
    tenseFocus: string;

    selectMaterial: string;
    verbId: string;
    disabledWhileLoading = true;
    repeatAnswer: string;

    completedPresent = [];
    completedPast = [];

    arabicPronouns: string[];
    waitNextVerb = 3000;
    waitNextForm = 3000;

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) {
        this.verbs = [];
        this.focusIndex = 0;
        this.focusVerb = null;
        this.focusCardCount = 0;
        this.continueLoop = true;
        this.lastRandom = 16;
        this.verbForms = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        this.formIndex = 0;
        this.advanceMethod = 'meth-tense';
        this.tenseFocus = '';
        this.selectMaterial = 'status';
        this.repeatAnswer = "1";
        this.verbId = '';
        this.arabicPronouns = LanguageUtils.pronouns;
    }

    ngOnInit() {
        this.audioPlayer.returnStatusSubject()
            .subscribe( (val) => {
                this.audioPlayerStatus = val;
                if (val.message === 'COMPLETE') {
                    if ((this.advanceMethod !== 'manual') && (this.formIndex == 16)) {
                        this.lastTimeout = setTimeout( () => {
                            this.nextVerb();
                        }, this.waitNextVerb);
                    } else if (this.continueLoop) {
                        this.lastTimeout = setTimeout( () => {
                            this.playCard();
                        }, this.waitNextForm);
                    }
                } else if (val.message === 'KILL_SEQUENCE') {
                    this.isAdvancing = false;
                    clearTimeout(this.lastTimeout);
                }
            })
        this.dataSource.getVerbs('')
            .subscribe(v => {
                if (v.status == 'success') {
                    this.allVerbs = v.data;
                    this.disabledWhileLoading = false;
                    console.log(this.allVerbs);
                    console.log('ready');
                } else {
                    console.log('error');
                    console.log(v);
                }
            })
    }

    ngOnDestroy() {
        this.audioPlayer.doKillSequence();
    }

    resetCompleted() {
        this.completedPast = [];
        this.completedPresent = [];
        for (let i=0; i<8; i++){ 
            this.completedPast.push(0);
            this.completedPresent.push(0);
        }
    }
    
    shuffleVerbs() {
        for (let i=this.verbs.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = this.verbs[i - 1];
            let b = this.verbs[r];
            this.verbs[i - 1] = b;
            this.verbs[r] = a;
        }
    }

    shuffleForms() {
        if (this.advanceMethod == 'meth-tense') {
            let pres = [0,1,2,3,4,5,6,7];
            let past = [8,9,10,11,12,13,14,15];
            for (let i=8; i>0; i--) {
                let r = Math.floor(Math.random() * (i - 1));
                let a = pres[i - 1];
                let b = pres[r];
                pres[i - 1] = b;
                pres[r] = a;
            }
            for (let i=8; i>0; i--) {
                let r = Math.floor(Math.random() * (i - 1));
                let a = past[i - 1];
                let b = past[r];
                past[i - 1] = b;
                past[r] = a;
            }
            this.verbForms = [];
            this.verbForms = pres.concat(past);
        } else if (this.advanceMethod = 'meth-form') {
            this.verbForms = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        } else {
            for (let i=16; i>0; i--) {
                let r = Math.floor(Math.random() * (i - 1));
                let a = this.verbForms[i - 1];
                let b = this.verbForms[r];
                this.verbForms[i - 1] = b;
                this.verbForms[r] = a;
            }
        }

    }

    beginStudy() {
        if (this.selectMaterial === 'status') {
            this.verbs = this.allVerbs.filter(v => {
                return v.status === 'study';
            })
            this.shuffleVerbs();
        } else if (this.selectMaterial === 'verb') {
            this.verbs = this.allVerbs.filter(v => {
                return v._id == this.verbId;
            })
        } else if (this.selectMaterial === 'all') {
            this.verbs = this.allVerbs.slice(0);
            this.shuffleVerbs();
        }
        if (this.verbs.length) {
            this.isLoading = false;
            this.showMain = true;
            this.loadVerb();
            this.playCard();
        } else {
            console.log('data not loaded');
        }
        if ((this.advanceMethod == 'meth-form') && (this.repeatAnswer == "1")) {
            this.waitNextForm += 1000;
        }
    }

    resetVerbForms(tense: string) {
        if (this.advanceMethod === 'meth-verb') {
            this.tenseFocus = 'both';
        } else {
            this.tenseFocus = tense;
        }
        this.shuffleForms();
        this.formIndex = 0;
        this.tenseFocus = tense;
    }

    loadVerb() {
        if (this.focusIndex > (this.verbs.length - 1)) {
            this.studyDone = true;
            this.showMain = false;
            this.continueLoop = false;
        } else {
            this.resetCompleted();
            this.focusVerb = this.verbs[this.focusIndex];
            this.focusCardCount = 0;
            if (this.advanceMethod != 'manual') {
                this.resetVerbForms('past');
            }
            this.resetVerbForms('past');
        }
    }

    nextVerb() {
        this.audioPlayer.doKillSequence();
        this.focusIndex++;
        this.loadVerb();
        console.log(this.focusVerb);
        this.playCard();
    }

    play() {
        this.continueLoop = true;
        this.loadVerb();
        this.playCard();
    }

    stop() {
        this.resetCompleted();
        this.continueLoop = false;
        this.isAdvancing = false;
        clearTimeout(this.lastTimeout);
        this.audioPlayer.doKillSequence();
    }

    showTable() {
        this.doShowTable = true;
    }

    hideTable() {
        this.doShowTable = false;
    }

    randomIndex(max: number): number {
        return Math.floor(Math.random() * max);
    }

    newConjugationIndex(): number {
        let found = false;
        let newIndex = 16;
        while (!found) {
            newIndex = this.randomIndex(16);
            if (newIndex != this.lastRandom) {
                found = true;
            }
        }
        this.lastRandom = newIndex;
        return newIndex;
    }

    generateSequence(): SequenceOptions {
        let sequence = {
            playCountA: 1,
            playCountB: 2,
            betweenA: 0,
            beforeAnswer: 3,
            betweenB: 2,
            sourcesA: [],
            sourcesB: [],
            directionAB: true,
            autoAdvanceOnComplete: false,
            isInitialSequence: true
        };
        let engBase = 'verbs/english/';
        let aBase = 'verbs/arabic/_' + this.focusVerb.a_audio_base + '_';
        let index = this.newConjugationIndex();
        let pronoun = LanguageUtils.engKeys[index % 8];
        sequence.sourcesA.push(engBase + this.focusVerb.eng_audio);
        if (index < 8) {
            sequence.sourcesA.push(engBase + LanguageUtils.engAudioTenses[0]);
            sequence.sourcesB.push(`${aBase}${pronoun}-pres.mp3`);
        } else {
            sequence.sourcesA.push(engBase + LanguageUtils.engAudioTenses[1]);
            sequence.sourcesB.push(`${aBase}${pronoun}-past.mp3`);
        }
        sequence.sourcesA.push(engBase + LanguageUtils.arabicAudioPronouns[index % 8]);
        return sequence;
    }

    playSequence(sequence: SequenceOptions) {
        this.audioPlayer.startAudioSequence(sequence);
    }

    generateOptions(): ConjugationOptions {
        let index = 0;
        let includeInfo = false;
        if (this.advanceMethod === 'manual') {
            index = this.randomIndex(16);
        } else {
            if (this.formIndex % 8 == 0) {
                includeInfo = true;
            }
            console.log(`Current tenseFocus: ${this.tenseFocus}`);
            console.log(`Current formIndex: ${this.formIndex}`);
            index = this.verbForms[this.formIndex];
            console.log(`index before tense modification: ${index}`);
            this.formIndex++;
            if (this.advanceMethod === 'meth-tense') {
                if (this.tenseFocus === 'present') {
                    index = index % 8;
                } else {
                    index = (index % 8) + 8;
                }
                console.log(`Effective index: ${index}`);
                if (this.tenseFocus === 'past' && this.formIndex == 16) {
                    this.tenseFocus = 'present';
                    this.formIndex = 0;
                }
            }
        }

        let timeIndex = this.randomIndex(5);
        let options = {
            engAudio: '',
            tenseAudio: '',
            pronounAudio: '',
            betweenA: 0.25,
            beforeB: 3.2,
            pronounWithB: true,
            betweenB: 3,
            playCountB: parseInt(this.repeatAnswer),
            arabicAudio: '',
            isLearnMode: (this.advanceMethod == 'meth-form')
        }
        console.log('focusCardCount', this.focusCardCount);
        if (this.advanceMethod == 'manual') {
            if (this.focusCardCount % 4 == 0) {
                options.engAudio = `verbs/english/${this.focusVerb.eng_audio}`;
            }
        } else {
            if (includeInfo) {
                options.engAudio = `verbs/english/${this.focusVerb.eng_audio}`;
            }
        }
        options.pronounAudio = `verbs/english/${LanguageUtils.arabicAudioPronouns[index % 8]}`;
        let pronoun = LanguageUtils.engKeys[index % 8];
        if (index < 8) {
            // present tense
            this.completedPresent[index]++;
            if (this.advanceMethod != 'meth-tense') {
                options.tenseAudio = `verbs/english/${LanguageUtils.arabicTimePresent[timeIndex]}`
            } else if (includeInfo) {
                options.tenseAudio = `verbs/english/arabic_present_tense.mp3`;
            }
            options.arabicAudio = `verbs/arabic/_${this.focusVerb.a_audio_base}_${pronoun}-pres.mp3`;
        } else {
            // past tense
            this.completedPast[index - 8]++;
            if (this.advanceMethod != 'meth-tense') {
                options.tenseAudio = `verbs/english/${LanguageUtils.arabicTimePast[timeIndex]}`;
            } else if (includeInfo) {
                options.tenseAudio = `verbs/english/arabic_past_tense.mp3`;
            }
            options.arabicAudio = `verbs/arabic/_${this.focusVerb.a_audio_base}_${pronoun}-past.mp3`;
        }
        return options;
    }

    playCard() {
        this.isAdvancing = true;
        let options = this.generateOptions();
        this.audioPlayer.startConjugationSequence(options);
        this.focusCardCount++;
    }

    getCellClass(count: number): string {
        switch(count) {
            case 0:
                return 'arabic-pronoun completed-0';
            case 1:
                return 'arabic-pronoun completed-1';
            case 2:
                return 'arabic-pronoun completed-2';
            case 3:
                return 'arabic-pronoun completed-3';
            default:
                return 'arabic-pronoun completed-x'
        }
    }
}
