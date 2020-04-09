import { Injectable } from '@angular/core';
import { Environment } from '../environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AudioPlayerStatus } from '../models/audio-player-status.model';
import { Word } from '../models/words/word.model';
import { SequenceOptions } from '../models/sequence-options.model';
import { AudioObject } from '../models/audio-object.model';

@Injectable({
    providedIn: 'root'
})

export class AudioPlayerService {

    private baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    private statusSubject = new BehaviorSubject<AudioPlayerStatus>({message: 'initial', isPlaying: false, log: []});
    private playerStatus: AudioPlayerStatus;
    private audioObject: HTMLAudioElement;
    private audioQueue: AudioObject[];
    private latestTimeout;
    private playIndex: number;
    private currentAudioObj: AudioObject;

    constructor() {
        this.statusSubject.subscribe((val) => {
            // console.log('ap:', val);
            this.playerStatus = val;
        })
        this.audioQueue = [];
    }

    public returnStatusSubject(): BehaviorSubject<AudioPlayerStatus> {
        return this.statusSubject;
    }

    resetIndex() {
        this.playIndex = 0;
    }

    getNextIndex(): number {
        this.playIndex++;
        return this.playIndex;
    }

    sendStatusUpdate(inputObj: any){
        let update = <AudioPlayerStatus>{
            log: [],
            message: '',
            isPlaying: false
        };
        update.log = this.playerStatus.log.slice(0);
        update.log.push(this.playerStatus.message);
        update.message = inputObj.message;
        update.isPlaying = this.playerStatus.isPlaying;
        Object.assign(update, inputObj);
        this.statusSubject.next(update);
    }

    public subscribeToStatus( observer ) {
        this.statusSubject.subscribe( observer );
    }

    public startAudioSequence(sequence: SequenceOptions) {
        let beforeAnswer = sequence.beforeAnswer;
        let audioObjects = [];
        this.resetIndex();
        if (sequence.directionAB) {
            // start with A sources
            audioObjects.push(new AudioObject(sequence.sourcesA[0], 0, this.getNextIndex()));
            // if sourcesA contains more than 1 file, add those remaing files to first playCount
            if (sequence.sourcesA.length > 1) {
                for (let i=1; i<sequence.sourcesA.length; i++) {
                    audioObjects.push(new AudioObject(sequence.sourcesA[i], sequence.betweenA, this.getNextIndex()));
                }
            }
            // loop through all of sourcesA for each remaining playCount
            if (sequence.playCountA > 1) {
                for (let i=1; i<sequence.playCountA; i++) {
                    for (let j=0; j<sequence.sourcesA.length; j++) {
                        audioObjects.push(new AudioObject(sequence.sourcesA[j], sequence.betweenA, this.getNextIndex()));
                    }
                }
            }
            if (sequence.sourcesB.length) {
                // include B sources (auto-play answer)
                audioObjects.push(new AudioObject(sequence.sourcesB[0], beforeAnswer, this.getNextIndex()));
                if (sequence.sourcesB.length > 1) {
                    for (let i=1; i<sequence.sourcesB.length; i++) {
                        audioObjects.push(new AudioObject(sequence.sourcesB[i], sequence.betweenB, this.getNextIndex()));
                    }
                }
                if (sequence.playCountB > 1) {
                    for (let i=1; i<sequence.playCountB; i++) {
                        for (let j=0; j<sequence.sourcesB.length; j++) {
                            audioObjects.push(new AudioObject(sequence.sourcesB[j], sequence.betweenB, this.getNextIndex()));
                        }
                    }
                }
            }
        } else {
            // start with B sources
            audioObjects.push(new AudioObject(sequence.sourcesB[0], 0, this.getNextIndex()));
            // if sourcesB contains more than 1 file, add those remaining files to first playCount
            if (sequence.sourcesB.length > 1) {
                for (let i=1; i<sequence.sourcesB.length; i++) {
                    audioObjects.push(new AudioObject(sequence.sourcesB[i], sequence.betweenB, this.getNextIndex()));
                }
            }
            // loop through all of sourcesB for each remaining playCount
            if (sequence.playCountB > 1) {
                for (let i=1; i<sequence.playCountB; i++) {
                    for (let j=0; j<sequence.sourcesB.length; j++) {
                        audioObjects.push(new AudioObject(sequence.sourcesB[j], sequence.betweenB, this.getNextIndex()));
                    }
                }
            }
            if (sequence.sourcesA.length) {
                // include A sources (auto-play answer)
                audioObjects.push(new AudioObject(sequence.sourcesA[0], beforeAnswer, this.getNextIndex()));
                if (sequence.sourcesA.length > 1) {
                    for (let i=1; i<sequence.sourcesA.length; i++) {
                        audioObjects.push(new AudioObject(sequence.sourcesA[i], sequence.betweenA, this.getNextIndex()));
                    }
                }
                if (sequence.playCountA > 1) {
                    for (let i=1; i<sequence.playCountA; i++) {
                        for (let j=0; j<sequence.sourcesA.length; j++) {
                            audioObjects.push(new AudioObject(sequence.sourcesA[j], sequence.betweenA, this.getNextIndex()));
                        }
                    }
                }
            }
        }
        this.audioQueue = audioObjects;
        this.doPlayAudioSequence();
    }

    doPlayAudioSequence() {
        this.sendStatusUpdate({message: 'sequence started'});
        this.doNextInQueue();
    }

    doNextInQueue() {
        if (this.audioQueue && this.audioQueue.length) {
            let playObject = this.audioQueue.splice(0,1)[0];
            this.currentAudioObj = playObject;
            this.playAudioObject(playObject);
        } else {
            // sequence complete
            this.audioObject.removeEventListener('ended', this.doNextInQueue);
            this.sendStatusUpdate({isPlaying: false, message: 'COMPLETE'});
        }
    }

    playAudioObject(playObject: AudioObject) {
        this.audioObject = new Audio();
        this.audioObject.src = playObject.fullSrc;
        this.audioObject.load();
        this.sendStatusUpdate({message: 'waiting for setTimeout to end'})
        this.latestTimeout = setTimeout(() => {
            this.sendStatusUpdate({message: 'playing audio object: ' + playObject.index, isPlaying: true});
            this.audioObject.play();
        }, playObject.delay);
        this.audioObject.addEventListener('ended', () => {
            this.sendStatusUpdate({message: 'audioObject finished playing', isPlaying: false});
            this.doNextInQueue();
        })
    }

    doPause() {
        this.sendStatusUpdate({message: 'PAUSE', isPlaying: false});
        if (this.audioObject) {
            this.audioObject.pause();
            this.audioObject.removeEventListener('ended', this.doNextInQueue);
        }
        clearTimeout(this.latestTimeout);
    }

    doResume() {
        this.sendStatusUpdate({message: 'RESUME', isPlaying: true});
        this.audioObject.addEventListener('ended', () => {
            this.sendStatusUpdate({message: 'audioObject finished playing', isPlaying: false});
            this.doNextInQueue();
        })
        this.playAudioObject(this.currentAudioObj);
    }

    doKillSequence() {
        this.sendStatusUpdate({message: 'KILL_SEQUENCE'});
        if (this.audioObject) {
            this.audioObject.pause();
            this.audioObject.removeEventListener('ended', this.doNextInQueue);
        }
        clearTimeout(this.latestTimeout);
        this.audioQueue.splice(0);
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