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
    errorBold: string;
    errorText: string;
    audioPlayerStatus: AudioPlayerStatus;
    isPaused: boolean;
    isSequencePlaying: boolean;
    currentCardAB: boolean;
    nextCardTimeout;

    // options
    options = {
        autoPlayCount: 3,
        answerDelay: 3,
        direction: 'AB',
        autoLoadNext: true,
        autoPlayAnswer: true,
        loopOnFinish: false,
        betweenA: 1.5,
        betweenB: 2
    }

    words: Word[] = [];
    playlists: Playlist[] = [];
    focusIndex: number;
    focusWord: Word;
    textA: string[];
    textB: string[];
    showTextA: boolean;
    showTextB: boolean;


    playlistSelectedId: string;
    tagSelected: string;

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) {
    }

    ngOnInit() {
        this.showSettings = true;
        this.showSelection = false;
        this.showStudy = false;
        this.showCompleted = false;
        this.showDebug = false;
        this.isLoading = false;
        this.displayError = false;
        this.errorBold = '';
        this.errorText = '';
        this.focusIndex = 0;
        this.focusWord = null;
        this.playlistSelectedId = 'none';
        this.tagSelected = '';
        this.isPaused = false;
        this.isSequencePlaying = false;
        this.showTextA = false;
        this.showTextB = false;
        this.audioPlayer.returnStatusSubject()
            .subscribe((val) => {
                // console.log(val);
                this.audioPlayerStatus = val;
                if (val.message === 'COMPLETE') {
                    this.isSequencePlaying = false; 
                    if (val.autoAdvance) {
                        this.nextCardTimeout = setTimeout(() => {
                            this.toNext();
                        }, 2500);
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

    toggleSwitch(switchName: string) {
        this.options[switchName] = !this.options[switchName];
    }

    saveSettings() {
        this.showSettings = false;
        this.showSelection = true;
    }

    showError(boldText: string, text: string) {
        this.errorBold = boldText
        this.errorText = text;
        this.displayError = true;
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

    toggleDebug() {
        this.showDebug = !this.showDebug;
    }

    selectMaterial(sType: string) {
        this.isLoading = true;
        let queryString = `limit=0`;
        if (sType === 'playlist') {
            queryString = queryString + `&playlist=${this.playlistSelectedId}`;
        } else if (sType === 'tag') {
            queryString = queryString + `&searchText=${this.tagSelected}&searchTarget=tags`;
        }
        this.dataSource.getVocab(queryString)
            .subscribe(response => {
                if (response.status === 'success') {
                    this.words = response.data;
                    this.isLoading = false;
                    this.showSelection = false;
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

    beginLearning() {
        this.focusIndex = 0;
        this.shuffleWords();
        this.loadWord();
    }

    toNext() {
        this.focusIndex++;
        if (this.focusIndex > this.words.length - 1) {
            if (this.options.loopOnFinish) {
                // restart from beginning after shuffle
                this.beginLearning();
            } else {
                // process completed - show stats or exit screen
                this.showStudy = false;
                this.showCompleted = true;
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
        this.playSequence(initialSequence);
    }

    generateInitialSequence(): SequenceOptions {
        let sequence = {
            playCountA: 1,
            playCountB: this.options.autoPlayCount,
            betweenA: this.options.betweenA,
            beforeAnswer: this.options.answerDelay,
            betweenB: this.options.betweenB,
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
            betweenA: this.options.betweenA,
            beforeAnswer: 0,
            betweenB: this.options.betweenB,
            sourcesA: [],
            sourcesB: [],
            directionAB: this.currentCardAB,
            autoAdvanceOnComplete: false,
            isInitialSequence: false
        };
        sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
        // if (this.currentCardAB) {
        //     sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
        // } else {
        //     sequence.sourcesA = this.getAudioSourcesB(this.focusWord);
        // }
        return sequence;
    }

    generateResponseSequence(): SequenceOptions {
        let sequence = {
            playCountA: 0,
            playCountB: 1,
            betweenA: this.options.betweenA,
            beforeAnswer: 0,
            betweenB: this.options.betweenB,
            sourcesA: [],
            sourcesB: [],
            directionAB: this.currentCardAB,
            autoAdvanceOnComplete: false,
            isInitialSequence: false
        };
        // if (this.currentCardAB) {
        //     sequence.sourcesA = this.getAudioSourcesB(this.focusWord);
        // } else {
        //     sequence.sourcesA = this.getAudioSourcesA(this.focusWord);
        // }
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
