import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';
import { IdDrillOptions } from 'src/app/models/verb-sets/id-drill-options.model';
import { IdDrillData } from 'src/app/models/verb-sets/id-drill-data.model';
import { LanguageUtils } from 'src/app/language-utils';
import { AudioPlayerStatus } from 'src/app/models/audio-player-status.model';
import { VerbFormChoice } from 'src/app/models/verb-sets/verb-form-choice.model';
import { SimpleAudioOptions } from 'src/app/models/verb-sets/simple-audio-options.model';
import { Environment } from 'src/app/environment';

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
    focusFormChoice: VerbFormChoice;
    allowAdvance: boolean;
    history: IdDrillData[];
    optionHistory: IdDrillOptions[];
    showDebug: boolean;

    pastTenseChoices: VerbFormChoice[];
    presTenseChoices: VerbFormChoice[];

    guessedVerb: VerbSet;
    guessedForm: VerbFormChoice;
    showAnswerRow: boolean;
    showReference: boolean;
    verdict: string;

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
    autoAdvance: string;

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
        this.autoAdvance = 'on-correct';
        this.allowAdvance = true;
        this.counter = 0;
        this.verbs = [];
        this.history = [];
        this.optionHistory = [];
        this.guessedVerb = null;
        this.guessedForm = null;
        this.presTenseChoices = [];
        this.pastTenseChoices = [];
        this.showAnswerRow = false;
        this.showReference = false;
        for (let i=0; i<8; i++) {
            let pres = new VerbFormChoice('present', LanguageUtils.pronouns[i], i);
            console.log(`formIndex ${i}: ${pres.arabicPronoun} - present`);
            this.presTenseChoices.push(pres);
        }
        for (let i=8; i<16; i++) {
            let past = new VerbFormChoice('past', LanguageUtils.pronouns[(i % 8)], i);
            console.log(`formIndex ${i}: ${past.arabicPronoun} - past`);
            this.pastTenseChoices.push(past);
        }
    }

    ngOnInit() {
        // this.statusSub = this.audioPlayer.returnStatusSubject()
        //     .subscribe(val => {
        //         this.audioPlayerStatus = val;
        //         if ((val.message === 'COMPLETE') && this.allowAdvance) {
        //             this.lastTimeout = setTimeout(() => {
        //                 this.nextIdSequence();
        //             }, (this.default.beforeNextSequence * 1000));
        //         } else if (val.message === 'KILL_SEQUENCE') {
        //             this.allowAdvance = false;
        //             clearTimeout(this.lastTimeout);
        //         }
        //     })
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
        if (this.drillType === 'id-click') {
            this.statusSub = this.audioPlayer.returnSimpleStatusSubject()
                .subscribe(val => {
                    let parts = val.split(':');
                    if ((parts[0] === 'PROMPT') && (parts[1] === 'ENDED')) {
                        console.log(`prompt audio sequence ended`)
                    }
                    if (val == 'ANSWER:ENDED') {
                        if (this.autoAdvance == 'always') {
                            setTimeout(() => {
                                this.clickIdContinue();
                            }, 2000);
                        } else if (this.autoAdvance == 'on-correct') {
                            if (this.verdict == 'correct') {
                                setTimeout(() => {
                                    this.clickIdContinue();
                                }, 1000);
                            }
                        }
                    }
                })
        } else if (this.drillType === 'id-audio') {

        }
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
        } else if (this.drillMaterial === 'study-verbs-2') {
            // verbs with status of "study2"
            queryString = `collectionType=study2`;
        } else if (this.drillMaterial === 'study-verbs-both') {
            // verbs with status of "study" or "study2"
            queryString = `collectionType=study-both`;
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
        if (this.drillType === 'id-audio') {
            this.audioIdRound();
        } else if (this.drillType === 'id-click') {
            this.clickIdRound();
        }
    }

    clickIdRound() {
        let formIndex = Math.floor(Math.random() * 16);
        this.focusFormChoice = (formIndex < 8) ? this.presTenseChoices[formIndex] : this.pastTenseChoices[(formIndex % 8)];
        let options = this.generateSimpleAudioOptions(this.focusVerb, formIndex);
        this.audioPlayer.startSimpleAudio(options);
    }

    replayPrompt() {
        let options = this.generateSimpleAudioOptions(this.focusVerb, this.focusFormChoice.formIndex);
        this.audioPlayer.startSimpleAudio(options);
    }

    playAnswer() {
        let options = this.generateAnswerOptions(this.focusVerb, this.focusFormChoice.formIndex);
        this.audioPlayer.startSimpleAudio(options);
    }

    generateAnswerOptions(verb: VerbSet, formIndex: number): SimpleAudioOptions {
        let pronoun = this.getPronounAudioUrl(formIndex);
        let arabicAudio = this.getArabicAudioUrl(formIndex);
        let options = {
            audioAtoms: [
                {
                    audioFile: pronoun,
                    delay: 0
                },
                {
                    audioFile: arabicAudio,
                    delay: 0
                }
            ],
            flag: 'ANSWER'
        }
        return options;      
    }

    generateSimpleAudioOptions(verb: VerbSet, formIndex: number): SimpleAudioOptions {
        let arabicAudio = this.getArabicAudioUrl(formIndex);
        let options = {
            audioAtoms: [
                {
                    audioFile: arabicAudio,
                    delay: 0
                },
                {
                    audioFile: arabicAudio,
                    delay: 1
                }
            ],
            flag: 'PROMPT'
        }
        return options;
    }

    audioIdRound() {
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

    getPronounAudioUrl(formIndex: number): string {
        let index = formIndex % 8;
        return `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/verbs/english/${LanguageUtils.arabicAudioPronouns[index]}`;
    }

    getArabicAudio(formIndex: number): string {
        let tense = (formIndex < 8) ? 'pres' : 'past';
        let index = formIndex % 8;
        return `verbs/arabic/_${this.focusVerb.a_audio_base}_${LanguageUtils.engKeys[index]}-${tense}.mp3`;
    }

    getArabicAudioUrl(formIndex: number): string {
        let tense = (formIndex < 8) ? 'pres' : 'past';
        let index = formIndex % 8;
        return `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/verbs/arabic/_${this.focusVerb.a_audio_base}_${LanguageUtils.engKeys[index]}-${tense}.mp3`;
    }

    guessThisVerb(verb: VerbSet) {
        this.verbs.forEach(v => {
            v.isSelected = false;
        })
        verb.isSelected = true;
        this.guessedVerb = verb;
    }

    guessThisForm(choice: VerbFormChoice) {
        this.pastTenseChoices.forEach(c => {
            c.isSelected = false;
        })
        this.presTenseChoices.forEach(c => {
            c.isSelected = false;
        })
        choice.isSelected = true;
        this.guessedForm = choice;
    }

    checkAnswer() {
        this.playAnswer();
        this.showAnswerRow = true;
        let verbVerdict = this.focusVerb.eng_text == this.guessedVerb.eng_text;
        let tenseVerdict = this.focusFormChoice.tense == this.guessedForm.tense;
        let exactPronoun = this.focusFormChoice.formIndex == this.guessedForm.formIndex;
        let verdicts = [
            [0],
            [1,3],
            [2],
            [3,1],
            [4],
            [5],
            [6],
            [7],
            [8],
            [9],
            [10],
            [11,14],
            [12],
            [13],
            [14,11],
            [15]
        ];
        let exceptionIds = [
            "5e97a16f93c4783937746482", // buy
            "5e97a16f93c47839377464a0", // come
            "5e97a16f93c4783937746515", // give
            "5e97a16f93c4783937746518", // go 2
            "5e97a16f93c47839377465b4", // relate
            "5e97a16f93c47839377465e7" // show
        ];
        if (exceptionIds.includes(this.focusVerb._id)) {
            verdicts[1].push(4);
            verdicts[3].push(4);
            verdicts[4].push(1,3);
        }
        console.log('verdicts:');
        console.log(verdicts);
        console.log('guessedForm:');
        console.log(this.guessedForm);
        console.log('focusForm:');
        console.log(this.focusFormChoice);
        if (!verbVerdict) {
            this.verdict = 'incorrect';
            return;
        }
        if (!tenseVerdict) {
            this.verdict = 'incorrect';
            return;
        }
        if (exactPronoun) {
            this.verdict = 'correct';
            return;
        }
        if (verdicts[this.focusFormChoice.formIndex].includes(this.guessedForm.formIndex)) {
            this.verdict = 'correct';
            return;
        }
        this.verdict = 'incorrect';
    }

    hideReference() {
        this.showReference = false;
    }

    unhideReference() {
        this.showReference = true;
    }

    clickIdContinue() {
        console.log('clickIdContinue()');
        this.verbs.forEach(v => {
            v.isSelected = false;
        })
        this.presTenseChoices.forEach(c => {
            c.isSelected = false;
        })
        this.pastTenseChoices.forEach(c => {
            c.isSelected = false;
        })
        this.hideReference();
        this.showAnswerRow = false;
        this.nextIdSequence();
    }

}
