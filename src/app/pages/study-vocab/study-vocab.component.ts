import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { Word } from 'src/app/models/words/word.model';
import { Playlist } from 'src/app/models/playlist.model';
import { AudioPlayerStatus } from 'src/app/models/audio-player-status.model';
import { SequenceOptions } from 'src/app/models/sequence-options.model';

@Component({
    selector: 'app-study-vocab',
    templateUrl: './study-vocab.component.html',
    styleUrls: ['./study-vocab.component.scss']
})
export class StudyVocabComponent implements OnInit, OnDestroy {

    showSettings: boolean;
    showSelection: boolean;
    showStudy: boolean;
    showCompleted: boolean;
    showDebug: boolean;
    isLoading: boolean;
    displayError: boolean;
    displayInfo: boolean;
    errorBold: string;
    errorText: string;
    infoBold: string;
    infoText: string;
    audioPlayerStatus: AudioPlayerStatus;
    isPaused: boolean;
    isSequencePlaying: boolean;
    currentCardAB: boolean;
    nextCardTimeout;

    // options
    options = {
        autoPlayCount: '2',
        answerDelay: '2.5',
        direction: 'AB',
        autoLoadNext: true,
        autoPlayAnswer: true,
        onlyMastered: false,
        loopOnFinish: false,
        betweenA: '1.5',
        betweenB: '2',
        subset: 'subset-12',
        repetition: '2',
        sorting: 'old',
        beforeNext: '2.5'
    }

    cachedStype: string;
    words: Word[] = [];
    playlists: Playlist[] = [];
    focusIndex: number;
    focusWord: Word;
    textA: string[];
    textB: string[];
    showTextA: boolean;
    showTextB: boolean;

    setLength: number;
    playlistSelectedId: string;
    tagSelected: string;
    masteredProbability: string;

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) {
    }

    ngOnInit() {
        this.cachedStype = '';
        this.showSettings = true;
        this.showSelection = false;
        this.showStudy = false;
        this.showCompleted = false;
        this.showDebug = false;
        this.isLoading = false;
        this.displayError = false;
        this.errorBold = '';
        this.errorText = '';
        this.displayInfo = false;
        this.infoBold = '';
        this.infoText = '';
        this.focusIndex = 0;
        this.focusWord = null;
        this.playlistSelectedId = 'none';
        this.tagSelected = '';
        this.isPaused = false;
        this.isSequencePlaying = false;
        this.showTextA = false;
        this.showTextB = false;
        this.masteredProbability = '0';
        this.setLength = 0;
        this.audioPlayer.returnStatusSubject()
            .subscribe((val) => {
                // console.log(val);
                this.audioPlayerStatus = val;
                if (val.message === 'COMPLETE') {
                    this.isSequencePlaying = false;
                    this.touchCurrentCard();
                    if (val.autoAdvance) {
                        this.nextCardTimeout = setTimeout(() => {
                            this.toNext();
                        }, (parseInt(this.options.beforeNext) * 1000));
                    }
                }
                if (val.message === 'KILL_SEQUENCE') {
                    this.isSequencePlaying = false;
                }
                if (val.isNewSequence) {
                    this.showTextA = false;
                    this.showTextB = false;
                }
                if (val.showA) {
                    this.showTextA = true;
                }
                if (val.showB) {
                    this.showTextB = true;
                }
            })
        this.dataSource.getPlaylists()
            .subscribe(data => {
                if (data.status === 'success') {
                    this.playlists = data.data;
                } else {
                    console.log('error');
                }
            })
    }

    touchCurrentCard() {
        this.dataSource.touchVocab(this.focusWord)
            .subscribe(res => {
                console.log(res);
            })
    }

    ngOnDestroy() {
        this.audioPlayer.doKillSequence();
    }

    goBack() {
        this.isPaused = false;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doKillSequence();
        this.focusIndex--;
        this.loadWord();
    }

    skipToNext() {
        this.isPaused = false;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doKillSequence();
        this.toNext();
    }

    pauseAudio() {
        this.isPaused = true;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doPause();
    }

    resumeAudio() {
        this.isPaused = false;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doResume();
    }

    playPrompt() {
        this.isPaused = false;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doKillSequence();
        let prompt = this.generatePromptSequence();
        this.playSequence(prompt);
    }

    playResponse() {
        this.isPaused = false;
        clearTimeout(this.nextCardTimeout);
        this.audioPlayer.doKillSequence();
        let response = this.generateResponseSequence();
        this.playSequence(response);
    }

    updateMastery(id: string, mastery: boolean) {
        for (let i=0; i<this.words.length; i++) {
            if (this.words[i]._id === id) {
                this.words[i].mastered = mastery;
            }
        }
    }

    markMastered() {
        this.focusWord.mastered = true;
        this.updateMastery(this.focusWord._id, true);
        this.dataSource.updateVocab(this.focusWord)
            .subscribe(result => {
                if (result.status === 'success') {
                    console.log(result);
                } else {
                    console.error(result);
                }
            })
    }

    markNotMastered() {
        this.focusWord.mastered = false;
        this.updateMastery(this.focusWord._id, false);
        this.dataSource.updateVocab(this.focusWord)
            .subscribe(result => {
                if (result.status === 'success') {
                    this.showInfo('markNotMastered() succeded', result.data.mastered);
                } else {
                    this.showError('markNotMastered() failed', result.data);
                }
            })
    }

    toggleSwitch(switchName: string) {
        this.options[switchName] = !this.options[switchName];
    }

    showError(boldText: string, text: string) {
        this.errorBold = boldText
        this.errorText = text;
        this.displayError = true;
    }

    showInfo(boldText: string, text: string) {
        this.infoBold = boldText;
        this.infoText = text;
        this.displayInfo = true;
        setTimeout(() => {
            this.displayInfo = false;
        }, 4000);
    }

    hideError() {
        this.errorText = '';
        this.displayError = false;
    }

    shuffleWords() {
        for (let i=this.words.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = this.words[i - 1];
            let b = this.words[r];
            this.words[i - 1] = b;
            this.words[r] = a;
        }
    }

    shuffleArray(inputArray: any[]){
        for (let i=inputArray.length; i>0; i--) {
            let r = Math.floor(Math.random() * (i - 1));
            let a = inputArray[i - 1];
            let b = inputArray[r];
            inputArray[i - 1] = b;
            inputArray[r] = a;
        }
    }

    toggleDebug() {
        this.showDebug = !this.showDebug;
    }

    selectMaterial(sType: string) {
        this.cachedStype = sType;
        this.isLoading = true;
        let queryString = `limit=0`;
        if (sType === 'playlist') {
            queryString = queryString + `&playlist=${this.playlistSelectedId}`;
        } else if (sType === 'tag') {
            queryString = queryString + `&searchText=${this.tagSelected}&searchTarget=tags`;
        }
        if (this.options.sorting == 'old') {
            queryString = queryString + `&sorting=old`;
        }
        if (this.options.onlyMastered) {
            queryString = queryString + `&status=mastered`;
        }
        if (this.options.subset !== 'normal') {
            if (this.options.subset === 'subset-12') {
                queryString = queryString + `&subset=12`;
            } else if (this.options.subset === 'subset-24') {
                queryString = queryString + `&subset=24`;
            }
        }
        this.dataSource.getVocab(queryString)
            .subscribe(response => {
                if (response.status === 'success') {
                    this.words = this.applyProbabilityFilter(response.data);
                    this.shuffleWords();
                    this.setLength = this.words.length;
                    let reps = parseInt(this.options.repetition);
                    console.log(`reps: ${reps}`);
                    if (reps > 1) {
                        let rounds = [];
                        let originals = this.words.slice();
                        let lastIndex = originals.length - 1;
                        rounds.push(originals.slice());
                        console.log(`before reps loop: this.words has: ${this.words.length}`);
                        for(let i=1; i<reps; i++){
                            this.shuffleArray(originals);
                            rounds.push(originals.slice());
                            if (rounds[i - 1][lastIndex]._id == rounds[i][0]._id) {
                                let a = rounds[i][0];
                                let b = rounds[i][lastIndex];
                                rounds[i][0] = b;
                                rounds[i][lastIndex] = a;
                            }
                            console.log('rounds:');
                            console.log(rounds);
                            this.words = this.words.concat(rounds[i]);
                            console.log('this.words');
                            console.log(this.words);
                        }
                    }
                    this.isLoading = false;
                    this.showSelection = false;
                    this.showSettings = false;
                    if (this.words.length === 0) {
                        this.showError('Error!', 'Zero results');
                    } else {
                        this.showStudy = true;
                        this.beginLearning();
                    }
                } else {
                    this.isLoading = false;
                    this.showError('Error!', response.data);
                }
            })
    }

    selectSubset(words: Word[], count: number): Word[] {
        let subset = [];
        let oCount = words.length;
        if (oCount <= count) {
            return subset;
        }

        return subset;
    }

    applyProbabilityFilter(words: Word[]): Word[] {
        if (this.options.onlyMastered) {
            return words;
        }
        let selectedProbability = parseInt(this.masteredProbability);
        if (selectedProbability == 100) {
            console.log('100%, returning all words');
            return words;
        }
        let finalList = [];
        finalList = words.filter( (w) => {
            return w.mastered == false;
        })
        let countNotMastered = finalList.length;
        let countMastered = words.length - countNotMastered;
        if (selectedProbability != 0) {
            let mastered = words.filter( (w) => {
                return w.mastered == true;
            })
            for (let i=0; i<mastered.length; i++) {
                let r = Math.random() * 100;
                if (r < selectedProbability) {
                    finalList.push(mastered[i]);
                }
            }
            let includedMastered = finalList.length - countNotMastered;
            console.log(`mastered included / total mastered: ${includedMastered} / ${countMastered}`);
            let percent = Math.floor((includedMastered / countMastered) * 100);
            console.log(`( ${percent}% )`);
        }
        return finalList;
    }

    beginLearning() {
        this.focusIndex = 0;
        this.loadWord();
        console.log(this.options);
    }

    toNext() {
        this.focusIndex++;
        if (this.focusIndex > this.words.length - 1) {
            if (this.options.loopOnFinish) {
                // restart from beginning after shuffle
                this.showStudy = false;
                this.isLoading = true;
                this.selectMaterial(this.cachedStype);
            } else {
                // process completed - show stats or exit screen
                this.showStudy = false;
                this.showCompleted = true;
                setTimeout(() => {
                    location.reload();
                }, 5000);
            }
        } else {
            this.loadWord();
        }
    }

    loadWord() {
        let word = new Word();
        Object.assign(word, this.words[this.focusIndex]);
        this.focusWord = word;
        if (this.options.direction === 'AB') {
            this.currentCardAB = true;
        } else if (this.options.direction === 'BA') {
            this.currentCardAB = false;
        } else {
            this.currentCardAB = Math.random() < .5;
        }
        let initialSequence = this.generateInitialSequence();
        console.log(initialSequence);
        this.playSequence(initialSequence);
    }

    generateInitialSequence(): SequenceOptions {
        let sequence = {
            playCountA: 1,
            playCountB: parseInt(this.options.autoPlayCount),
            betweenA: parseInt(this.options.betweenA),
            beforeAnswer: parseInt(this.options.answerDelay),
            betweenB: parseInt(this.options.betweenB),
            sourcesA: [],
            sourcesB: [],
            directionAB: this.currentCardAB,
            autoAdvanceOnComplete: this.options.autoLoadNext,
            isInitialSequence: true
        };
        if (this.currentCardAB) {
            // get A sources
            sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
            if (this.options.autoPlayAnswer) {
                // get B sources too
                sequence.sourcesB = this.getAudioSourcesB(this.focusWord);
            }
        } else {
            sequence.directionAB = false;
            // get B sources
            sequence.sourcesB = this.getAudioSourcesB(this.focusWord);
            if (this.options.autoPlayAnswer) {
                // get A sources too
                sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
            }
        }
        return sequence;
    }

    generatePromptSequence(): SequenceOptions {
        let sequence = {
            playCountA: 1,
            playCountB: 0,
            betweenA: parseInt(this.options.betweenA),
            beforeAnswer: 0,
            betweenB: parseInt(this.options.betweenB),
            sourcesA: [],
            sourcesB: [],
            directionAB: this.currentCardAB,
            autoAdvanceOnComplete: false,
            isInitialSequence: false
        };
        sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
        return sequence;
    }

    generateResponseSequence(): SequenceOptions {
        let sequence = {
            playCountA: 0,
            playCountB: 1,
            betweenA: parseInt(this.options.betweenA),
            beforeAnswer: 0,
            betweenB: parseInt(this.options.betweenB),
            sourcesA: [],
            sourcesB: [],
            directionAB: this.currentCardAB,
            autoAdvanceOnComplete: false,
            isInitialSequence: false
        };
        sequence.sourcesB = this.getAudioSourcesB(this.focusWord);
        return sequence;
    }

    playSequence(sequence) {
        this.isSequencePlaying = true;
        this.audioPlayer.startAudioSequence(sequence);
    }


    getAudioSourcesA(word: Word) {
        switch(word.type) {
            case 'noun':
                return [word.eng_audio];
            case 'verb':
                return [word.eng_audio];
            case 'adjective':
                return [word.eng_audio];
            case 'other':
                return [word.eng_audio];
            default:
                return [word.eng_audio];
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

}
