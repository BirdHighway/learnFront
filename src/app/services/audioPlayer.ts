import { Injectable } from '@angular/core';
import { Environment } from '../environment';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AudioPlayerStatus } from '../models/audio-player-status.model';
import { Word } from '../models/words/word.model';
import { SequenceOptions } from '../models/sequence-options.model';
import { AudioObject } from '../models/audio-object.model';
import { ConjugationOptions } from '../models/conjugation-options';
import { IdDrillOptions } from '../models/verb-sets/id-drill-options.model';
import { SimpleAudioOptions } from '../models/verb-sets/simple-audio-options.model';
import { SimpleAudioObject } from '../models/verb-sets/simple-audio-object.model';

@Injectable({
    providedIn: 'root'
})

export class AudioPlayerService {

    private baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    // private baseUrl = `${Environment.PROTOCOL}://localhost:${Environment.PORT}/`;
    private statusSubject = new BehaviorSubject<AudioPlayerStatus>({message: 'initial', isPlaying: false, log: []});
    private playerStatus: AudioPlayerStatus;
    private audioObject: HTMLAudioElement;
    private audioQueue: AudioObject[];
    private simpleAudioQueue: SimpleAudioObject[];
    private latestTimeout;
    private playIndex: number;
    private currentAudioObj: AudioObject;
    private autoAdvanceOnComplete: boolean;

    private simpleStatusSubject = new BehaviorSubject('initial');
    private currentSequenceFlag: string;

    constructor() {
        this.statusSubject.subscribe((val) => {
            // console.log('ap:', val);
            this.playerStatus = val;
        })
        this.simpleStatusSubject.subscribe((val) => {
            console.log(`audioPlayer inner subscription: ${val}`);
        })
        this.audioQueue = [];
        this.simpleAudioQueue = [];
        this.currentSequenceFlag = 'INITIAL';
    }

    public returnStatusSubject(): BehaviorSubject<AudioPlayerStatus> {
        return this.statusSubject;
    }

    public returnSimpleStatusSubject(): BehaviorSubject<string> {
        return this.simpleStatusSubject;
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
            isPlaying: false,

        };
        update.log = this.playerStatus.log.slice(0);
        update.log.unshift(this.playerStatus.message);
        update.message = inputObj.message;
        update.isPlaying = this.playerStatus.isPlaying;
        Object.assign(update, inputObj);
        this.statusSubject.next(update);
    }

    public subscribeToStatus( observer ) {
        // will need to be unsubscribed
        this.statusSubject.subscribe( observer );
    }

    sendSimpleStatusUpdate(message: string) {
        this.simpleStatusSubject.next(message);
    }

    public subscribeToSimpleStatus(observer) {
        // will need to be unsubscribed
        this.simpleStatusSubject.subscribe(observer);
    }

    public startSimpleAudio(options: SimpleAudioOptions) {
        let simpleAudioObjects = [];
        let atoms = options.audioAtoms;
        for (let i=0; i<atoms.length; i++) {
            simpleAudioObjects.push(new SimpleAudioObject(atoms[i].audioFile, atoms[i].delay));
        }
        this.simpleAudioQueue = simpleAudioObjects;
        this.doPlaySimpleSequence(options.flag);
    }

    public startIdDrill(options: IdDrillOptions) {
        let audioObjects = [];
        // begin with Arabic verb form
        for (let i=0; i<options.playCountA; i++) {
            let delay = 0;
            if (i > 0) {
                delay = options.betweenA;
            }
            audioObjects.push(new AudioObject(options.arabicAudio, delay, 0, true));
        }
        // begin answer with English verb name
        audioObjects.push(new AudioObject(options.engAudio, options.beforeB, 0, false));
        // tense
        audioObjects.push(new AudioObject(options.tenseAudio, options.betweenB, 0, false));
        // pronoun
        audioObjects.push(new AudioObject(options.pronounAudio, options.betweenB, 0, false));
        // if repeat A
        for (let i=0; i<options.playCountRepeatA; i++) {
            let delay = options.beforeRepeat;
            if (i > 0) {
                delay = options.betweenA;
            }
            audioObjects.push(new AudioObject(options.arabicAudio, delay, 0, false));
        }
        audioObjects.push(new AudioObject(options.spacerSound, 0.5, 0, false));
        this.audioQueue = audioObjects;
        this.doPlayAudioSequence();
    }

    public startConjugationSequence(options: ConjugationOptions) {
        let audioObjects = [];
        this.resetIndex();
        if (!options.isLearnMode && !(options.isLearnMode2)) {
            if (options.engAudio !== '') {
                audioObjects.push(new AudioObject(options.engAudio, 0, this.getNextIndex(), true));
                audioObjects.push(new AudioObject(options.pronounAudio, options.betweenA, this.getNextIndex(), true));
            } else {
                audioObjects.push(new AudioObject(options.pronounAudio, 0, this.getNextIndex(), true));
            }
            if (options.tenseAudio) {
                audioObjects.push(new AudioObject(options.tenseAudio, options.betweenA, this.getNextIndex(), true));
            }
        }

        if (options.isLearnMode2) {
            if (options.engAudio !== '') {
                audioObjects.push(new AudioObject(options.engAudio, 0, this.getNextIndex(), true));
            }
        }
        let beforeFirstB = 0;
        if (options.isLearnMode) {
            if (options.engAudio !== '') {
                audioObjects.push(new AudioObject(options.engAudio, 0, this.getNextIndex(), true));
                beforeFirstB = 1.5;
            }
        }
        if (!options.isLearnMode) {
            beforeFirstB = options.beforeB;
        }
        if (options.isLearnMode2) {
            beforeFirstB = 0;
        }
        // first B loop
        if (options.pronounWithB) {
            audioObjects.push(new AudioObject(options.pronounAudio, beforeFirstB, this.getNextIndex(), false));
            audioObjects.push(new AudioObject(options.arabicAudio, 0, this.getNextIndex(), false));
        } else {
            audioObjects.push(new AudioObject(options.arabicAudio, beforeFirstB, this.getNextIndex(), false));
        }
        // additional B loops?
        if (options.playCountB > 1) {
            for (let i=1; i<options.playCountB; i++) {
                if (options.pronounWithB) {
                    audioObjects.push(new AudioObject(options.pronounAudio, options.betweenB, this.getNextIndex(), false));
                    audioObjects.push(new AudioObject(options.arabicAudio, 0, this.getNextIndex(), false));
                } else {
                    audioObjects.push(new AudioObject(options.arabicAudio, options.betweenB, this.getNextIndex(), false));
                }              
            }
        }
        this.audioQueue = audioObjects;
        this.doPlayAudioSequence();
    }

    public startAudioSequence(sequence: SequenceOptions) {
        this.autoAdvanceOnComplete = sequence.autoAdvanceOnComplete;
        let beforeAnswer = sequence.beforeAnswer;
        let audioObjects = [];
        this.resetIndex();
        if (sequence.isInitialSequence) {
            this.sendStatusUpdate({isNewSequence: true, showA: false, showB: false});
        }
        if (sequence.directionAB) {
            // start with A sources
            if (sequence.sourcesA.length) {
                audioObjects.push(new AudioObject(sequence.sourcesA[0], 0, this.getNextIndex(), true));
            }
            // if sourcesA contains more than 1 file, add those remaing files to first playCount
            if (sequence.sourcesA.length > 1) {
                for (let i=1; i<sequence.sourcesA.length; i++) {
                    audioObjects.push(new AudioObject(sequence.sourcesA[i], sequence.betweenA, this.getNextIndex(), true));
                }
            }
            // loop through all of sourcesA for each remaining playCount
            if (sequence.playCountA > 1) {
                for (let i=1; i<sequence.playCountA; i++) {
                    for (let j=0; j<sequence.sourcesA.length; j++) {
                        audioObjects.push(new AudioObject(sequence.sourcesA[j], sequence.betweenA, this.getNextIndex(), true));
                    }
                }
            }
            if (sequence.sourcesB.length) {
                // include B sources (auto-play answer)
                audioObjects.push(new AudioObject(sequence.sourcesB[0], beforeAnswer, this.getNextIndex(), false));
                if (sequence.sourcesB.length > 1) {
                    for (let i=1; i<sequence.sourcesB.length; i++) {
                        audioObjects.push(new AudioObject(sequence.sourcesB[i], sequence.betweenB, this.getNextIndex(), false));
                    }
                }
                if (sequence.playCountB > 1) {
                    for (let i=1; i<sequence.playCountB; i++) {
                        for (let j=0; j<sequence.sourcesB.length; j++) {
                            audioObjects.push(new AudioObject(sequence.sourcesB[j], sequence.betweenB, this.getNextIndex(), false));
                        }
                    }
                }
            }
        } else {
            // start with B sources
            if (sequence.sourcesB.length) {
                audioObjects.push(new AudioObject(sequence.sourcesB[0], 0, this.getNextIndex(), false));
            }
            // if sourcesB contains more than 1 file, add those remaining files to first playCount
            if (sequence.sourcesB.length > 1) {
                for (let i=1; i<sequence.sourcesB.length; i++) {
                    audioObjects.push(new AudioObject(sequence.sourcesB[i], sequence.betweenB, this.getNextIndex(), false));
                }
            }
            // loop through all of sourcesB for each remaining playCount
            if (sequence.playCountB > 1) {
                for (let i=1; i<sequence.playCountB; i++) {
                    for (let j=0; j<sequence.sourcesB.length; j++) {
                        audioObjects.push(new AudioObject(sequence.sourcesB[j], sequence.betweenB, this.getNextIndex(), false));
                    }
                }
            }
            if (sequence.sourcesA.length) {
                // include A sources (auto-play answer)
                audioObjects.push(new AudioObject(sequence.sourcesA[0], beforeAnswer, this.getNextIndex(), true));
                if (sequence.sourcesA.length > 1) {
                    for (let i=1; i<sequence.sourcesA.length; i++) {
                        audioObjects.push(new AudioObject(sequence.sourcesA[i], sequence.betweenA, this.getNextIndex(), true));
                    }
                }
                if (sequence.playCountA > 1) {
                    for (let i=1; i<sequence.playCountA; i++) {
                        for (let j=0; j<sequence.sourcesA.length; j++) {
                            audioObjects.push(new AudioObject(sequence.sourcesA[j], sequence.betweenA, this.getNextIndex(), true));
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

    doPlaySimpleSequence(flag = '') {
        this.currentSequenceFlag = flag;
        this.sendSimpleStatusUpdate(`BEGIN:${flag}`);
        this.doNextSimpleAudio();
    }

    doNextSimpleAudio() {
        if (this.simpleAudioQueue && this.simpleAudioQueue.length) {
            let nextObject = this.simpleAudioQueue.splice(0,1)[0];
            this.playSimpleAudio(nextObject);
        } else {
            // sequence complete
            // this.audioObject.removeEventListener('ended', this.doNextSimpleAudio);
            this.sendSimpleStatusUpdate(`${this.currentSequenceFlag}:ENDED`);
        }
    }

    playSimpleAudio(audioObject: SimpleAudioObject) {
        this.audioObject = new Audio();
        this.audioObject.src = audioObject.filePath;
        this.audioObject.load();
        this.latestTimeout = setTimeout(() => {
            this.audioObject.play();
        }, audioObject.delay);
        this.audioObject.addEventListener('ended', () => {
            this.doNextSimpleAudio();
        });
    }

    doNextInQueue() {
        if (this.audioQueue && this.audioQueue.length) {
            let playObject = this.audioQueue.splice(0,1)[0];
            this.currentAudioObj = playObject;
            this.playAudioObject(playObject);
        } else {
            // sequence complete
            this.audioObject.removeEventListener('ended', this.doNextInQueue);
            this.sendStatusUpdate({isPlaying: false, message: 'COMPLETE', autoAdvance: this.autoAdvanceOnComplete});
        }
    }

    playAudioObject(playObject: AudioObject) {
        this.audioObject = new Audio();
        this.audioObject.src = playObject.fullSrc;
        this.audioObject.load();
        this.sendStatusUpdate({message: 'waiting for setTimeout to end'})
        this.latestTimeout = setTimeout(() => {
            this.sendStatusUpdate({message: 'playing audio object: ' + playObject.index, isPlaying: true});
            if (playObject.isSideA) {
                this.sendStatusUpdate({showA: true});
            } else {
                this.sendStatusUpdate({showB: true});
            }
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
        this.audioQueue.splice(0);
        if (this.audioObject) {
            this.audioObject.pause();
            this.audioObject.removeEventListener('ended', this.doNextInQueue);
        }
        clearTimeout(this.latestTimeout);
        this.audioObject = new Audio();
    }

    public playFromSource(audioSrc: string) {
        this.audioObject = new Audio();
        this.audioObject.src = this.baseUrl + audioSrc;
        this.audioObject.load();
        this.audioObject.play();
    }

}