import { Component, OnInit, OnDestroy } from '@angular/core';
import { RestDataSource } from '../../models/rest.datasource';
import { Noun } from '../../models/noun.model';
import { AudioService } from 'src/app/services/audio.service';
import { BehaviorSubject } from 'rxjs';
import { PlayObject } from 'src/app/models/play-object.model';

@Component({
    selector: 'app-learn',
        templateUrl: './learn.component.html',
        styleUrls: ['./learn.component.scss']
    })
    export class LearnComponent implements OnInit, OnDestroy {

    setLoaded: boolean;
    setStarted: boolean;
    categorySelected: string;
    nounSet: Noun[];

    currentNoun: Noun;
    currentIndex: number;
    isPaused: boolean;
    latestPlayTimeout;

    showOptions: boolean;
    bhsLink: BehaviorSubject<boolean>;

    // pause in ms between Arabic words
    opWordSpace: number = 2800;
    opNextSpace: number = 2000;

    // learning options
    opAutoLoadNext: boolean;
    opAutoPlayEnglish: boolean;
    opAutoPlayArabic: boolean;
    opIncludeArabicPlural: boolean;
    opShowArabicText: boolean;
    opLoopOnFinish: boolean;
    opAutoPlayCount: number;
    opArabicDelay: number;

    constructor(
        private restDataSource: RestDataSource,
        private audioService: AudioService
    ) {
        this.setLoaded = false;
        this.setStarted = false;
        this.showOptions = true;
        // default options
        this.opAutoLoadNext = true;
        this.opAutoPlayArabic = true;
        this.opIncludeArabicPlural = true;
        this.opShowArabicText = true;
        this.opLoopOnFinish = false;
        this.opAutoPlayCount = 3;
        this.opArabicDelay = 3;
        this.currentIndex = 0;
        this.categorySelected = 'all';
        this.isPaused = false;
    }

    ngOnInit() {

    }

    ngOnDestroy() {
        console.log('ngOnDestroy()');
        this.killSequence();
    }

    killSequence(){
        this.isPaused = true;
        this.audioService.doKillSequence();
        clearTimeout(this.latestPlayTimeout);
        this.isPaused = true;
    }

    previousCard() {
        this.killSequence();
        this.isPaused = false;
        // stop current play
        if( this.currentIndex > 0) {
            this.currentIndex--;
        }
        this.loadNoun();
    }

    togglePause() {
        if (this.isPaused) {
            // was paused
            // now resume progress
            this.isPaused = false;
            this.playAudioSequence();
        } else {
            // was playing
            // now stopped playing
            this.killSequence();
        }
    }

    nextCard() {
        this.killSequence();
        this.isPaused = false;
        this.loadNext();
    }

    loadSelectedSet() {
        if (this.categorySelected === 'all') {
            this.restDataSource.getNouns()
                .subscribe( (data) => {
                    this.nounSet = data;
                    this.shuffleNouns();
                    this.setLoaded = true;
                })
        } else {
            this.restDataSource.getCategory(this.categorySelected)
            .subscribe( (data) => {
                this.nounSet = data;
                this.shuffleNouns();
                this.setLoaded = true;
            })
        }
    }

    shuffleNouns() {
        let length = this.nounSet.length;
        for(let i=length; i>0; i--){
            let r = Math.floor(Math.random() * i);
            let a = this.nounSet[i - 1];
            let b = this.nounSet[r];
            this.nounSet[i - 1] = b;
            this.nounSet[r] = a;
        }   
    }

    beginLearning() {
        this.currentIndex = 0;
        this.shuffleNouns();
        this.setStarted = true;
        this.showOptions = false;
        this.loadNoun();
    }

    getProgress(): number {
        return this.currentIndex + 1;
    }

    getSetLength(): number {
        if (this.nounSet) {
            return this.nounSet.length;
        } else {
            return 0;
        }
    }

    getArabicDelay(): number {
        return this.opArabicDelay * 1000;
    }

    loadNoun() {
        this.currentNoun = this.nounSet[this.currentIndex];
        this.playAudioSequence();
    }

    loadNext() {
        this.currentIndex++;
        if (this.currentIndex > this.nounSet.length - 1) {
            if (this.opLoopOnFinish) {
                this.beginLearning();
            }
        } else {
            this.loadNoun();
        }
    }

    openOptions() {
        this.showOptions = true;
    }

    closeOptions() {
        this.showOptions = false;
    }

    toggleSwitch(name: string) {
        switch(name) {
            case 'autoPlayEnglish':
                this.opAutoPlayEnglish = !this.opAutoPlayEnglish;
                break;
            case 'autoPlayArabic':
                this.opAutoPlayArabic = !this.opAutoPlayArabic;
                break;
            case 'includeArabicPlural':
                this.opIncludeArabicPlural = !this.opIncludeArabicPlural;
                break;
            case 'showArabicText':
                this.opShowArabicText = !this.opShowArabicText;
                break;
            case 'loopOnFinish':
                this.opLoopOnFinish = !this.opLoopOnFinish;
                break;
            case 'autoLoadNext':
                this.opAutoLoadNext = !this.opAutoLoadNext;
                break;
        }
    }

    getPromptText() {
        return this.currentNoun.eng_text;
    }

    getArabicText() {
        if (this.currentNoun.a_sing_text) {
            return this.currentNoun.a_sing_text;
        } else {
            return '-';
        }
    }

    getPauseBtnText() {
        if (this.isPaused) {
            return 'Continue Learning';
        } else {
            return 'Pause Audio';
        }
    }

    generateSequence(): PlayObject[] {
        let sequence = [];
        let english = new PlayObject(this.currentNoun.eng_audio, 0);
        sequence.push(english);
        if (!this.opAutoPlayArabic) {
            return sequence;
        }
        sequence.push(new PlayObject(this.currentNoun.a_sing_audio, this.getArabicDelay()));
        let includePlural = this.opIncludeArabicPlural && this.currentNoun.a_pl_audio;
        if (includePlural) {
            sequence.push( new PlayObject(this.currentNoun.a_pl_audio, this.opWordSpace));
        }
        for(let i=1; i<this.opAutoPlayCount; i++){
            sequence.push(new PlayObject(this.currentNoun.a_sing_audio, this.opWordSpace));
            if (includePlural) {
                sequence.push(new PlayObject(this.currentNoun.a_pl_audio, this.opWordSpace));
            }
        }
        return sequence;
    }

    playArabic() {
        this.killSequence();
        let sequence = [];
        sequence.push(new PlayObject(this.currentNoun.a_sing_audio, 0));
        if (this.opIncludeArabicPlural && this.currentNoun.a_pl_audio) {
            sequence.push(new PlayObject(this.currentNoun.a_pl_audio, this.opWordSpace));
        }
        this.audioService.doPlayAudioSequence(sequence);
    }

    playAudioSequence() {
        let sequence = this.generateSequence();
        let audioSubject = this.audioService.doPlayAudioSequence(sequence);
        audioSubject.subscribe({
            complete: () => {
                if (this.opAutoLoadNext && this.opAutoPlayArabic && !this.isPaused) {
                    this.latestPlayTimeout = setTimeout(() => {
                        this.loadNext();
                    }, this.opNextSpace)
                }
            }
        })
    }


    playPrompt() {
        console.log('playPrompt()');
        this.killSequence();
        this.audioService.playSingle('noun/' + this.currentNoun.eng_audio);
    }



}
