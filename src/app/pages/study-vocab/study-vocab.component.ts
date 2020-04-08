import { Component, OnInit } from '@angular/core';
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
export class StudyVocabComponent implements OnInit {

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

    // options
    options = {
        autoPlayCount: 3,
        answerDelay: 3,
        direction: 'AB',
        autoLoadNext: true,
        autoPlayAnswer: true,
        loopOnFinish: false
    }

    words: Word[] = [];
    playlists: Playlist[] = [];
    focusIndex: number;
    focusWord: Word;


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
        this.showDebug = true;
        this.isLoading = false;
        this.displayError = false;
        this.errorBold = '';
        this.errorText = '';
        this.focusIndex = 0;
        this.focusWord = null;
        this.playlistSelectedId = 'none';
        this.tagSelected = '';
        this.audioPlayer.returnStatusSubject()
            .subscribe((val) => {
                console.log(val);
                this.audioPlayerStatus = val;
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

    pause() {

    }

    stop() {

    }

    resume() {

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
                    this.showStudy = true;
                    this.beginLearning();
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
        this.focusWord = this.words[this.focusIndex];
    }

    generateSequence(): SequenceOptions[] {
        let direction = this.options.direction;
        let sequence = [];
        if (direction === 'RANDOM') {
            if (Math.random() < .5) {
                direction = 'AB';
            }
        }
        if (direction === 'AB') {
            let prompts = this.focusWord.promptAudioSources();
            if (this.options.autoPlayAnswer) {

            }
        } else {
            let responses = this.focusWord.responseAudioSources();
            if (this.options.autoPlayAnswer) {
                
            }
        }
        return sequence;
    }

    playSequence() {
        let sequence = this.generateSequence();
        this.audioPlayer.doPlaySequence(sequence);
    }



}
