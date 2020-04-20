import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';
import { TableRow } from 'src/app/models/verb-sets/table-row.model';
import { AudioPlayerService } from 'src/app/services/audioPlayer';

@Component({
    selector: 'app-verb-sets-single',
    templateUrl: './verb-sets-single.component.html',
    styleUrls: ['./verb-sets-single.component.scss']
})
export class VerbSetsSingleComponent implements OnInit {

    _id: string;
    verb: VerbSet;
    showDisplay: boolean;
    showEdit: boolean;
    newValues: VerbSet;
    savePending: boolean;
    rows: TableRow[] = [];
    engKeys = ['he', 'she', 'they', 'you_male', 'you_female', 'you_plural', 'i', 'we'];
    pronouns = ["هو", "هي", "هم", "انْتَ", "انْتِ", "انْتُوا", "أَنا", "احْنا"];

    constructor(
        private route: ActivatedRoute,
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService)
        {
            this.showDisplay = false;
            this.showEdit = false;
            this.savePending = false;
        }

    ngOnInit() {
        this._id = this.route.snapshot.paramMap.get('id');
        this.dataSource.getVerbs('_id=' + this._id)
            .subscribe(resp => {
                this.verb = resp.data[0];
                this.showDisplay = true;
                for (let i=0; i<8; i++) {
                    this.rows.push({
                        person: this.pronouns[i],
                        past_text: this.verb.a_past_text[this.engKeys[i]],
                        present_text: this.verb.a_pres_text[this.engKeys[i]],
                        past_audio: `_${this.verb.a_audio_base}_${this.engKeys[i]}-past.mp3`,
                        present_audio: `_${this.verb.a_audio_base}_${this.engKeys[i]}-pres.mp3`                        
                    })
                }
            })
    }

    enterEditMode() {
        this.showDisplay = false;
        this.showEdit = true;
        this.newValues = new VerbSet();
        Object.assign(this.newValues, this.verb);
        console.log(this.newValues);
    }

    saveEdit() {
        this.savePending = true;
        this.dataSource.updateVerb(this.newValues)
            .subscribe( data => {
                console.log(data);
                if (data.status === 'success') {
                    this.savePending = false;
                    this.showDisplay = true;
                    this.showEdit = false;
                    this.verb = data.data;
                } else {
                    console.log("Error");
                }
            })
    }

    cancelEdit() {
        this.showDisplay = true;
        this.showEdit = false;
    }

    playSound(audioFile: string) {
        let src = `verbs/arabic/${audioFile}`;
        this.audioPlayer.playFromSource(src);
    }

}
