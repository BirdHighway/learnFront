import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';
import { Word } from 'src/app/models/words/word.model';
import { FlashcardRound } from 'src/app/models/flashcard-round.model';
import { FlashcardStatus } from 'src/app/models/flashcard-status.model';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { Environment } from 'src/app/environment';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
    selector: 'app-flashcards',
    templateUrl: './flashcards.component.html',
    styleUrls: ['./flashcards.component.scss']
})
export class FlashcardsComponent implements OnInit {

    showOptions: boolean;
    showMain: boolean;
    showCompleted: boolean;
    showProgress: boolean;
    showIntermission: boolean;
    answerControl: string;
    answerDelay: number;
    advanceDelay: number;
    nextRoundDelay: number;
    showAnswer: boolean;
    selectionType: string;
    includeMastered: string;
    playlists: Playlist[];
    playlistSelectedId: string;
    playlistSelected: Playlist;
    limitInput: number;
    vocabSet: Word[];
    refWord: Word;
    showRef: boolean;
    progress: FlashcardRound[];
    currentRoundIds: string[];
    nextRoundIds: string[];
    currentWord: Word;
    answerPlayed: boolean;
    answerDone: boolean;
    answerScored: boolean;
    scoredCorrect: boolean;
    enableReplayNext: boolean;
    audioPlaying: boolean;
    cachedStatus: string;

    statusSub;
    lastTimeout;

    constructor(private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService) {
        this.showOptions = false;
        this.showMain = false;
        this.showCompleted = false;
        this.showProgress = false;
        this.showAnswer = false;
        this.showIntermission = false;
        this.answerControl = 'auto';
        this.answerDelay = 3000;
        this.advanceDelay = 2000;
        this.nextRoundDelay = 5000;
        this.selectionType = 'playlist';
        this.playlistSelectedId = 'none';
        this.includeMastered = 'no';
        this.limitInput = 24;
        this.progress = [];
        this.vocabSet = [];
        this.currentRoundIds = [];
        this.nextRoundIds = [];
        this.answerPlayed = false;
        this.answerDone = false;
        this.answerScored = false;
        this.scoredCorrect = false;
        this.enableReplayNext = true;
        this.audioPlaying = false;
        this.showRef = false;
        this.cachedStatus = '';
    }

    ngOnInit() {
        this.dataSource.getPlaylists()
            .subscribe(response => {
                this.playlists = response.data;
                this.showOptions = true;
            })
    }

    beginStudy() {
        this.loadVocab();
        this.statusSub = this.audioPlayer.returnSimpleStatusSubject()
            .subscribe(val => {
                let parts = val.split(':');
                if ((parts[0] == 'PROMPT') && (parts[1] == 'ENDED')) {
                    this.audioPlaying = false;
                    if (this.answerControl === 'auto') {
                        if (this.answerScored) {
                            this.lastTimeout = setTimeout(() => {
                                this.playAnswer('RESPONSE');
                            }, 1000);
                        } else {
                            this.lastTimeout = setTimeout(() => {
                                this.playAnswer('RESPONSE');
                            }, this.answerDelay);
                        }

                    }
                } else if ((parts[0] == 'RESPONSE') && (parts[1] == 'ENDED')) {
                    this.answerDone = true;
                    this.audioPlaying = false;
                    if (this.answerScored && this.scoredCorrect) {
                        this.enableReplayNext = false;
                        setTimeout(() => {
                            this.advance();
                        }, this.advanceDelay);
                    } else {
                        this.enableReplayNext = true;
                        setTimeout(() => {
                            this.replayAnswer();
                        }, this.advanceDelay)
                    }
                } else if ((parts[0] == 'REPLAY') && (parts[1] == 'ENDED')) {
                    this.audioPlaying = false;
                    this.enableReplayNext = true;
                    if (this.answerControl === 'auto') {

                        console.log('setTimeout for advance()');
                        setTimeout(() => {
                            if (!this.answerScored) {
                                this.markUnknown();
                                this.advance();
                            }
                            console.log('advance()');
                        }, (this.advanceDelay + 1000));
                    }
                }
            })
    }



    nextCard() {
        this.hideReference();
        this.answerPlayed = false;
        if (this.currentRoundIds.length) {
            let newId = this.currentRoundIds.pop();
            this.currentWord = this.wordFromId(newId);
            this.playPrompt();
        } else if (this.nextRoundIds.length) {
            this.newRound();
            this.showMain = false;
            this.showIntermission = true;
            setTimeout(() => {
                this.showMain = true;
                this.showIntermission = false;
                this.nextCard();
            }, this.nextRoundDelay);
        } else {
            this.showMain = false;
            this.showCompleted = true;
        }
    }

    playPrompt() {
        this.audioPlaying = true;
        let audioFile = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/vocab_audio/${this.currentWord.eng_audio}`;
        let options = {
            audioAtoms: [
                {
                    audioFile: audioFile,
                    delay: 0
                }
            ],
            flag: 'PROMPT'
        }
        this.audioPlayer.startSimpleAudio(options);
    }

    replayAnswer() {
        this.playAnswer('REPLAY');
    }

    playAnswer(flag: string) {
        if (this.audioPlaying) {
            return;
        }
        this.audioPlaying = true;
        this.enableReplayNext = false;
        this.showAnswer = true;
        this.answerPlayed = true;
        let sources = this.getAudioSourcesB(this.currentWord);
        let options = {
            audioAtoms: [],
            flag: flag
        }
        for (let i=0; i<sources.length; i++) {
            let audioFile = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/vocab_audio/${sources[i]}`;
            if (i==0) {
                options.audioAtoms.push({
                    audioFile: audioFile,
                    delay: 0
                })
            } else {
                options.audioAtoms.push({
                    audioFile: audioFile,
                    delay: 1.5
                })
            }
        }
        console.log(options);
        this.audioPlayer.startSimpleAudio(options);
    }

    wordFromId(id: string): Word {
        let index = this.vocabSet.findIndex(w => w._id === id);
        if (index == -1) {
            throw new Error('No Word found with that index');
        }
        return this.vocabSet[index];
    }

    newRound() {
        this.hiddenProgressRow();
        this.currentRoundIds = this.nextRoundIds.splice(0);
        this.shuffleCurrentRound();
    }

    newProgressRow() {
        let statuses = [];
        this.vocabSet.forEach(v => {
            let fs = new FlashcardStatus(v._id);
            statuses.push(fs);
        })
        let round = new FlashcardRound(statuses);
        this.progress.push(round);
    }

    hiddenProgressRow() {
        let statuses = [];
        this.vocabSet.forEach(v => {
            let fs = new FlashcardStatus(v._id);
            fs.status = 'hidden';
            statuses.push(fs);
        })
        let round = new FlashcardRound(statuses);
        this.progress.push(round);
    }

    updateStatus(id: string, status: string) {
        let currentIndex = this.progress.length - 1;
        this.progress[currentIndex].updateChildStatus(id, status);
    }

    getStatus(id: string): string {
        let currentIndex = this.progress.length - 1;
        return this.progress[currentIndex].getChildStatus(id);
    }

    initialSetup() {
        let iStatuses = [];
        let statuses = [];
        this.vocabSet.forEach(v => {
            let status = 'initial';
            if (!v.isActive) {
                status = 'inactive';
            } else {
                if (v.mastered) {
                    status = 'mastered';
                } else {
                    status = 'unmastered';
                }
            }
            let fsi = new FlashcardStatus(v._id);
            fsi.status = status;
            let fs1 = new FlashcardStatus(v._id);
            fs1.status = status;
            iStatuses.push(fsi);
            statuses.push(fs1);
            this.currentRoundIds.push(v._id);
        })
        let intialRound = new FlashcardRound(iStatuses);
        let round = new FlashcardRound(statuses);
        this.progress.push(intialRound);
        this.progress.push(round);
        this.showOptions = false;
        this.showMain = true;
        this.showProgress = true;
    }

    doBegin() {
        this.nextCard();
    }

    loadVocab() {
        let queryString = ``;
        if (this.selectionType == 'playlist') {
            queryString = `playlist=${this.playlistSelectedId}&limit=50&mast=${this.includeMastered}`;
        } else if (this.selectionType == 'last-practiced') {
            queryString = `lastPracticed=true&limit=${this.limitInput}&mast=${this.includeMastered}`;
        }
        this.dataSource.getFlashcardVocab(queryString)
            .subscribe(response => {
                if (response.status === 'success') {
                    let rawData = response.data;
                    this.vocabSet = [];
                    rawData.forEach(d => {
                        let w = new Word();
                        Object.assign(w, d);
                        this.vocabSet.push(w);
                    })
                    if (this.vocabSet.length > this.limitInput) {
                        this.vocabSet = this.reduceVocab(this.vocabSet, this.limitInput);
                    }
                    console.log(this.vocabSet);
                    this.initialSetup();
                    console.log(`INCLUDE MASTERED: ${this.includeMastered}`);
                    this.vocabSet.forEach(w => {
                        let eng = w.eng_text.substr(0,10);
                        let mast = w.mastered ? 'mastered' : 'not';
                        console.log(`${eng} - ${mast}`);
                    })
                    this.shuffleCurrentRound();
                    this.doBegin();
                } else {
                    console.error(response.data);
                }
            })
    }

    reduceVocab(arr: Word[], size: number): Word[] {
        for (let i=arr.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = arr[i - 1];
            let b = arr[r];
            arr[i - 1] = b;
            arr[r] = a;
        }
        if (size == 0) {
            return arr;
        }
        return arr.splice(0, size);
    }

    markKnown() {
        this.enableReplayNext = false;
        clearTimeout(this.lastTimeout);
        this.dataSource.touchVocab(this.currentWord)
            .subscribe(res => {
                console.log(res);
            })
        // if this is the first round,
        // update correct answers as "mastered" in DB
        if ((this.progress.length == 2) && (!this.currentWord.mastered)) {
            this.currentWord.mastered = true;
            // this.dataSource.updateVocab(this.currentWord)
            // .subscribe(result => {
            //     if (result.status != 'success') {
            //         console.error(result.data);
            //     } else {
            //         console.log(`${this.currentWord.eng_text} mastered TRUE`);
            //     }
            // })
            this.updateStatus(this.currentWord._id, 'newly-mastered');
        } else {
            this.updateStatus(this.currentWord._id, 'correct');
        }
        this.showAnswer = true;
        this.answerScored = true;
        this.scoredCorrect = true;
        if (!this.answerPlayed) {
            this.playAnswer('RESPONSE');
        }
        if (this.answerDone) {
            setTimeout(() => {
                this.advance();
            }, this.advanceDelay);
        }
    }

    markUnknown() {
        clearTimeout(this.lastTimeout);
        this.showAnswer = true;
        this.answerScored = true;
        // if this is a mastered word
        // update it to "unmastered" in DB
        if (this.currentWord.mastered) {
            this.currentWord.mastered = false;
            this.dataSource.updateVocab(this.currentWord)
                .subscribe(result => {
                    if (result.status != 'success') {
                        console.error(result.data);
                    } else {
                        console.log(`${this.currentWord.eng_text} mastered FALSE`)
                    }
                })
            this.updateStatus(this.currentWord._id, 'mastered-wrong');
        } else {
            this.updateStatus(this.currentWord._id, 'wrong');
        }
        this.nextRoundIds.push(this.currentWord._id);
        if (!this.answerPlayed) {
            this.playAnswer('RESPONSE');
        }
    }

    advance() {
        this.enableReplayNext = true;
        this.answerScored = false;
        this.scoredCorrect = false;
        this.showAnswer = false;
        this.answerDone = false;
        this.nextCard();
    }

    shuffleCurrentRound() {
        for (let i=this.currentRoundIds.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = this.currentRoundIds[i - 1];
            let b = this.currentRoundIds[r];
            this.currentRoundIds[i - 1] = b;
            this.currentRoundIds[r] = a;
        }    
    }

    getAudioSourcesB(word: Word) {
        let sources = [];
        switch(word.type) {
            case 'noun':
                if (word.data_noun.a_sing_audio && word.data_noun.a_sing_audio.length) {
                    sources.push(word.data_noun.a_sing_audio);
                }
                if (word.data_noun.a_pl_audio && word.data_noun.a_pl_audio.length) {
                    sources.push(word.data_noun.a_pl_audio);
                }
                break;
            case 'verb':
                if (word.data_verb.a_past_3sm_audio && word.data_verb.a_past_3sm_audio.length) {
                    sources.push(word.data_verb.a_past_3sm_audio);
                }
                if (word.data_verb.a_pres_3sm_audio && word.data_verb.a_pres_3sm_audio.length) {
                    sources.push(word.data_verb.a_pres_3sm_audio);
                }
                break;
            case 'adjective':
                if (word.data_adj.a_masc_audio && word.data_adj.a_masc_audio.length) {
                    sources.push(word.data_adj.a_masc_audio);
                }
                if (word.data_adj.a_fem_audio && word.data_adj.a_fem_audio.length) {
                    sources.push(word.data_adj.a_fem_audio);
                }
                if (word.data_adj.a_pl_audio && word.data_adj.a_pl_audio.length) {
                    sources.push(word.data_adj.a_pl_audio);
                }
                break;
            case 'other':
                if (word.data_other.a_word_audio && word.data_other.a_word_audio.length) {
                    sources.push(word.data_other.a_word_audio);
                }
                if (word.data_other.a_word_audio_2 && word.data_other.a_word_audio_2.length) {
                    sources.push(word.data_other.a_word_audio_2);
                }
                if (word.data_other.a_word_audio_3 && word.data_other.a_word_audio_3.length) {
                    sources.push(word.data_other.a_word_audio_3);
                }                
                break;
            default:
                if (word.data_other.a_word_audio && word.data_other.a_word_audio.length) {
                    sources.push(word.data_other.a_word_audio);
                }
                break;
        }
        return sources;
    }

    showReference(wordId: string) {
        this.hideReference();
        let index = this.vocabSet.findIndex(w => w._id == wordId);
        if (index !== -1) {
            this.refWord = this.vocabSet[index];
            this.showRef = true;
            this.cachedStatus = this.getStatus(wordId);
            this.updateStatus(wordId, 'reference');
        }
    }

    hideReference() {
        if (this.refWord) {
            this.updateStatus(this.refWord._id, this.cachedStatus);
        }
        this.cachedStatus = '';
        this.showRef = false;
        this.refWord = null;
    }

}
