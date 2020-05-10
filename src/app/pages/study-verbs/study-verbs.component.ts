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

    shuffleSetting: string;

    lastRandom: number;
    advanceMethod: string;
    verbForms: number[];
    formIndex: number;
    advanceIndex: number;

    selectMaterial: string;
    verbId: string;
    disabledWhileLoading = true;
    repeatAnswer: string;
    rounds: string;

    completedPresent = [];
    completedPast = [];

    arabicPronouns: string[];
    waitNextVerb = 3000;
    waitNextForm = 3000;

    answerDelay = '3';

    statusSub;
    getSub;
    touchSub;
    touchSubManual;

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
        this.advanceIndex = 16;
        this.shuffleSetting = 'no-shuffle';
        this.advanceMethod = 'meth-tense';
        this.selectMaterial = 'status';
        this.repeatAnswer = "1";
        this.rounds = "2";
        this.verbId = '';
        this.arabicPronouns = LanguageUtils.pronouns;
    }

    ngOnInit() {
        this.statusSub = this.audioPlayer.returnStatusSubject()
            .subscribe( (val) => {
                this.audioPlayerStatus = val;
                if (val.message === 'COMPLETE') {
                    if ((this.advanceMethod !== 'manual') && (this.formIndex == this.getAdvanceIndex())) {
                        if (this.advanceMethod !== 'meth-form') {
                            this.touchSub = this.dataSource.touchVerb(this.focusVerb._id)
                                .subscribe(result => {
                                    console.log(result);
                                })
                        }
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
        this.getSub = this.dataSource.getVerbs('sortPracticed=true')
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

    getAdvanceIndex(): number {
        return this.advanceIndex;
    }

    ngOnDestroy() {
        clearTimeout(this.lastTimeout);
        this.audioPlayer.doKillSequence();
        this.statusSub.unsubscribe();
        this.getSub.unsubscribe();
        if (this.touchSub) {
            this.touchSub.unsubscribe();
        }
        if (this.touchSubManual) {
            this.touchSubManual.unsubscribe();
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

    beginStudy() {
        if (this.advanceMethod != 'manual') {
            this.advanceIndex = parseInt(this.rounds) * 16;
        }
        if (this.selectMaterial === 'status') {
            this.verbs = this.allVerbs.filter(v => {
                return v.status === 'study';
            })
            if (this.shuffleSetting === 'shuffle') {
                this.shuffleVerbs();
            }
        }else if (this.selectMaterial === 'study2') {
            this.verbs = this.allVerbs.filter(v => {
                return v.status === 'study2';
            })
            if (this.shuffleSetting === 'shuffle') {
                this.shuffleVerbs();
            }
        } else if (this.selectMaterial === 'verb') {
            this.verbs = this.allVerbs.filter(v => {
                return v._id == this.verbId;
            })
        } else if (this.selectMaterial === 'all') {
            this.verbs = this.allVerbs.slice(0);
            if (this.shuffleSetting === 'shuffle') {
                this.shuffleVerbs();
            }
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
            this.waitNextForm -= 1000;
        }
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
                this.resetVerbForms();
            }
        }
    }

    resetCompleted() {
        this.completedPast = [];
        this.completedPresent = [];
        for (let i=0; i<8; i++){ 
            this.completedPast.push(0);
            this.completedPresent.push(0);
        }
    }

    resetVerbForms() {
        this.shuffleForms();
        this.formIndex = 0;
    }

    shuffleForms() {
        if (this.advanceMethod === 'manual') {
            // no work necessary
        } else if (this.advanceMethod == 'meth-tense') {
            let past = [];
            let pres = [];
            for (let i=0; i<parseInt(this.rounds); i++) {
                let secondEight = this.randomIndices('second-eight');
                let firstEight = this.randomIndices('first-eight');
                for (let j=0; j<8; j++) {
                    past.push(secondEight[j]);
                    pres.push(firstEight[j]);
                }
            }
            this.verbForms = [];
            this.verbForms = past.concat(pres);
            console.log('this.verbForms');
            console.log(this.verbForms);
        } else if (this.advanceMethod === 'meth-verb') {
            this.verbForms = [];
            for (let i=0; i<parseInt(this.rounds); i++) {
                this.verbForms.concat(this.randomIndices('full'));
            }
        } else if (this.advanceMethod = 'meth-form') {
            this.verbForms = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        }
    }

    randomIndices(typeSought: string): number[] {
        let arr;
        if (typeSought === 'first-eight') {
            arr = [0,1,2,3,4,5,6,7];
        } else if (typeSought === 'second-eight') {
            arr = [8,9,10,11,12,13,14,15];
        } else if (typeSought === 'full') {
            arr = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
        }
        for (let i=arr.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = arr[i - 1];
            let b = arr[r];
            arr[i - 1] = b;
            arr[r] = a;
        }
        return arr;
    }

    nextVerb() {
        this.audioPlayer.doKillSequence();
        if ((this.advanceMethod === 'manual') && (this.focusCardCount > 16)) {
            this.touchSubManual = this.dataSource.touchVerb(this.focusVerb._id)
                .subscribe(result => {
                    console.log(result);
                })
        }
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
            beforeAnswer: parseInt(this.answerDelay),
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
        let englishFrequency = 4;
        let tenseFrequency = 1;
        let pronoun = '';
        let timeIndex = this.randomIndex(5);
        let options = <ConjugationOptions>{
            engAudio: '',
            tenseAudio: '',
            pronounAudio: '',
            betweenA: 0.25,
            beforeB: parseInt(this.answerDelay),
            pronounWithB: true,
            betweenB: 3,
            playCountB: parseInt(this.repeatAnswer),
            arabicAudio: '',
            isLearnMode: (this.advanceMethod === 'meth-form')
        }

        if (this.advanceMethod === 'manual') {
            // randomly until next is clicked
            index = this.randomIndex(16);
            // play English translation every 4 forms
            englishFrequency = 4;
            // play the tense every form
            tenseFrequency = 1;
        } else if (this.advanceMethod === 'meth-tense') {
            // randomly through one tense at a time
            index = this.verbForms[this.formIndex];
            // play English translation every 8 forms
            englishFrequency = 8;
            // play the tense when the tense changes
            tenseFrequency = 8;
        } else if (this.advanceMethod === 'meth-verb') {
            // randomly throough both tenses
            index = this.verbForms[this.formIndex];
            // play English translation every 4 forms
            englishFrequency = 4;
            // play the tense every form
            tenseFrequency = 1;
        } else if (this.advanceMethod === 'meth-form') {
            // methodically through both tenses
            index = this.formIndex;
            // play English translation every 4 forms
            englishFrequency = 4;
            // play the tense when the tense changes
            tenseFrequency = 8;
            // apply this.answerDelay to options.betweenB
            options.betweenB = parseInt(this.answerDelay);
        }
        // play English translation every X forms
        if ((this.focusCardCount % englishFrequency) === 0) {
            options.engAudio = `verbs/english/${this.focusVerb.eng_audio}`;
        }
        // get Arabic pronoun audio file src
        options.pronounAudio = `verbs/english/${LanguageUtils.arabicAudioPronouns[index % 8]}`;
        // get English name for pronoun (will be used to get Arabic audio file name)
        pronoun = LanguageUtils.engKeys[index % 8];
        console.log(index);
        console.log(pronoun);
        if (index < 8) {
            // PRESENT TENSE
            // Arabic audio file will eng in "-pres.mp3"
            options.arabicAudio = `verbs/arabic/_${this.focusVerb.a_audio_base}_${pronoun}-pres.mp3`;
            // increment record of present tense rounds
            this.completedPresent[index]++;
            // get Arabic audio file that signals the tense for this form
            // play the tense cue every X forms
            if ((this.focusCardCount % tenseFrequency) === 0) {
                options.tenseAudio = `verbs/english/${LanguageUtils.arabicTimePresent[timeIndex]}`;
            }
        } else {
            // PAST TENSE
            // Arabic audio file will end in "-past.mp3"
            options.arabicAudio = `verbs/arabic/_${this.focusVerb.a_audio_base}_${pronoun}-past.mp3`;
            // increment record of past tense rounds
            this.completedPast[index - 8]++;
            // get Arabic audio file that signals the tense for this form
            // play the tense cue every X forms
            if ((this.focusCardCount % tenseFrequency) === 0) {
                options.tenseAudio = `verbs/english/${LanguageUtils.arabicTimePast[timeIndex]}`;
            }
        }
        this.formIndex++;
        return options;
    }

    playCard() {
        this.isAdvancing = true;
        let options = this.generateOptions();
        console.log(options);
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
            case 4:
                return 'arabic-pronoun completed-4';
            default:
                return 'arabic-pronoun completed-x'
        }
    }
}
