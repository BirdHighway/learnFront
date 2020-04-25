import { Component, OnInit, Inject, LOCALE_ID } from '@angular/core';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { formatDate } from '@angular/common';

@Component({
    selector: 'app-verb-sets',
    templateUrl: './verb-sets.component.html',
    styleUrls: ['./verb-sets.component.scss']
})
export class VerbSetsComponent implements OnInit {

    verbs: VerbSet[];

    constructor(
        private dataSource: RestDataSource,
        private audioService: AudioPlayerService,
        @Inject(LOCALE_ID) private locale: string
    ) { }

    ngOnInit() {
        this.dataSource.getVerbs('')
            .subscribe(v => {
                if (v.status == 'success') {
                    this.verbs = v.data;
                    console.log(this.verbs);
                } else {
                    console.log('error');
                    console.log(v);
                }
            })
    }

    play(audio_base: string, tense: string) {
        let src = `verbs/arabic/_${audio_base}_he-${tense}.mp3`;
        this.audioService.playFromSource(src);
    }

    playEnglish(engFile: string) {
        let src = `verbs/english/${engFile}`;
        this.audioService.playFromSource(src);
    }

    lastPracticedText(last: string, ever: boolean): string {
        if (ever) {
            return formatDate(new Date(last), 'MMM d, h:mm a', this.locale);
        } else {
            return '-';
        }
    }

}
