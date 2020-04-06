import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { PlayObject } from '../models/play-object.model';
import { Environment } from '../environment';

@Injectable({
    providedIn: 'root'
})

export class AudioService {

    private isPlaying: boolean;
    private audioObj: HTMLAudioElement;
    private audioSubject: Subject<boolean>;
    private playQueue: PlayObject[];
    private lastestTimeout;

    constructor() {
        this.isPlaying = false;
        
    }

    doPlayAudioSequence(sequence: PlayObject[]): Subject<boolean> {
        this.playQueue = sequence;
        this.audioSubject = new Subject();
        this.doNextInQueue();
        return this.audioSubject;
    }

    doKillSequence() {
        if(this.playQueue){
            this.playQueue.splice(0);
        }
        if (this.lastestTimeout) {
            clearTimeout(this.lastestTimeout);
        }
        if (this.audioObj) {
            this.audioObj.removeEventListener('ended', this.doNextInQueue);
            this.audioObj.pause();
        }
        this.audioObj = new Audio();
        if (this.audioSubject) {
            this.audioSubject.complete();
        }
    }

    doNextInQueue() {
        if (this.playQueue && this.playQueue.length > 0) {
            let playObject = this.playQueue.splice(0,1)[0];
            this.doPlayObject(playObject);
        } else {
            this.audioSubject.complete();
            this.audioObj.removeEventListener('ended', this.doNextInQueue);
        }
    }
    
    doPlayObject(playObject: PlayObject) {
        this.audioObj = new Audio();
        this.audioObj.src = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/` + playObject.getFilePath();
        this.audioObj.load();
        this.lastestTimeout = setTimeout(() => {
            this.audioObj.play();
        }, playObject.getDelay());
        this.audioObj.addEventListener('ended', () => {
            this.doNextInQueue();
        });
    }

    playSingle(path: string) {
        this.audioObj = new Audio();
        this.audioObj.src = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/${path}`;
        this.audioObj.load();
        this.audioObj.play();
    }

}

