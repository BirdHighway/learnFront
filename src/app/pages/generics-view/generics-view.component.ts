import { Component, OnInit, OnDestroy } from '@angular/core';
import { VocabRepository } from 'src/app/models/vocab.repository';
import { GenericPrompt } from 'src/app/models/generic.model';
import { AudioPlayerService } from 'src/app/services/audioPlayer';

@Component({
    selector: 'app-generics-view',
    templateUrl: './generics-view.component.html',
    styleUrls: ['./generics-view.component.scss']
})
export class GenericsViewComponent implements OnInit, OnDestroy {

    sets: GenericPrompt[];
    dataLoaded: boolean = false;
    playerStatus: string = 'initial';
    searchTerm: string;
    searchTarget: string;

    constructor(
        private vocabRepository: VocabRepository,
        private audioPlayer: AudioPlayerService
    ) { }

    ngOnInit() {
        this.vocabRepository.getGenerics().subscribe( (data) => {
            this.sets = data;
            this.dataLoaded = true;
        });
        this.audioPlayer.subscribeToStatus( 
            {next: (val) => {
                console.log('next:', val);
                this.playerStatus = val;
            },
            error: (err) => {
                console.log('AudioPlayer status subscription error:', err);
            },
            complete: () => {

            }}
        );
    }

    ngOnDestroy() {
        // kill AudioPlayerService

    }

    getRelevantSets(): GenericPrompt[] {
        return this.sets;
    }

    playAudioFile(audioSrc: string) {
        this.audioPlayer.playFromSource(`pr_sets/${audioSrc}`);
    }

}
