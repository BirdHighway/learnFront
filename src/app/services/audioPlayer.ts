import { Injectable } from '@angular/core';
import { Environment } from '../environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AudioPlayerStatus } from '../models/audio-player-status.model';
import { Word } from '../models/words/word.model';
import { SequenceOptions } from '../models/sequence-options.model';

@Injectable({
    providedIn: 'root'
})

export class AudioPlayerService {

    private baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    private statusSubject = new BehaviorSubject<AudioPlayerStatus>({title: 'initial', isPlaying: false, progress: 0});
    private playerStatus: AudioPlayerStatus;
    private audioObject: HTMLAudioElement;

    constructor() {
        this.statusSubject.subscribe((val) => {
            console.log('ap:', val);
            this.playerStatus = val;
        })

        setTimeout(() => {
            this.statusSubject.next({title: 'in progress', isPlaying: true, progress: 45});
        }, 1000);
        setTimeout(() => {
            this.statusSubject.next({title: 'in progress', isPlaying: true, progress: 95});
        }, 2000);

    }

    public returnStatusSubject(): BehaviorSubject<AudioPlayerStatus> {
        return this.statusSubject;
    }

    public subscribeToStatus( observer ) {
        this.statusSubject.subscribe( observer );
    }

    public doPlaySequence(sequence: SequenceOptions[]) {

    }

    public playFromSource(audioSrc: string) {
        // if (this.playerStatus == 'playing audio') {
        //     return;
        // } 
        // this.statusSubject.next('preparing to play');
        // this.audioObject = new Audio();
        // this.audioObject.src = this.baseUrl + audioSrc;
        // this.audioObject.load();
        // this.audioObject.addEventListener('ended', () => {
        //     this.statusSubject.next('audio ended');
        // })
        // this.statusSubject.next('playing audio');
        // this.audioObject.play();
    }


}