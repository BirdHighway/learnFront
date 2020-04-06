import { Injectable } from '@angular/core';
import { Environment } from '../environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class AudioPlayerService {

    private baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    private statusSubject = new BehaviorSubject('initial');
    private playerStatus: string;
    private audioObject: HTMLAudioElement;

    constructor() {
        this.statusSubject.subscribe((val) => {
            this.playerStatus = val;
        })
    }

    public subscribeToStatus( observer ) {
        this.statusSubject.subscribe( observer );
    }

    public playFromSource(audioSrc: string) {
        if (this.playerStatus == 'playing audio') {
            return;
        } 
        this.statusSubject.next('preparing to play');
        this.audioObject = new Audio();
        this.audioObject.src = this.baseUrl + audioSrc;
        this.audioObject.load();
        this.audioObject.addEventListener('ended', () => {
            this.statusSubject.next('audio ended');
        })
        this.statusSubject.next('playing audio');
        this.audioObject.play();
    }


}