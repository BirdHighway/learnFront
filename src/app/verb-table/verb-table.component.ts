import { Component, OnInit, Input, SimpleChange, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { VerbSet } from '../models/verb-sets/verb-set.model';
import { TableRow } from '../models/verb-sets/table-row.model';
import { AudioPlayerService } from '../services/audioPlayer';

@Component({
    selector: 'app-verb-table',
    templateUrl: './verb-table.component.html',
    styleUrls: ['./verb-table.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerbTableComponent implements OnInit {

    @Input() verb: VerbSet;
    rows: TableRow[] = [];
    engKeys = ['he', 'she', 'they', 'you_male', 'you_female', 'you_plural', 'i', 'we'];
    pronouns = ["هو", "هي", "هم", "انْتَ", "انْتِ", "انْتُوا", "أَنا", "احْنا"];

    constructor(
        private audioPlayer: AudioPlayerService
    ) { }

    ngOnInit() {
        this.initializeRows();
    }

    initializeRows() {
        this.rows = [];
        for (let i=0; i<8; i++) {
            this.rows.push({
                person: this.pronouns[i],
                past_text: this.verb.a_past_text[this.engKeys[i]],
                present_text: this.verb.a_pres_text[this.engKeys[i]],
                past_audio: `_${this.verb.a_audio_base}_${this.engKeys[i]}-past.mp3`,
                present_audio: `_${this.verb.a_audio_base}_${this.engKeys[i]}-pres.mp3`
            })
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        console.log('ngOnChanges');
        this.initializeRows();
    }

    playSound(audioFile: string) {
        let src = `verbs/arabic/${audioFile}`;
        this.audioPlayer.playFromSource(src);
    }

}
