import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { Word } from 'src/app/models/words/word.model';
import { Playlist } from 'src/app/models/playlist.model';

@Component({
    selector: 'app-study-vocab',
    templateUrl: './study-vocab.component.html',
    styleUrls: ['./study-vocab.component.scss']
})
export class StudyVocabComponent implements OnInit {

    showSettings: boolean;
    showSelection: boolean;
    showStudy: boolean;

    words: Word[] = [];
    playlists: Playlist[] = [];

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) { }

    ngOnInit() {
        this.showSettings = true;
        this.showSelection = false;
        this.showStudy = false;
        this.dataSource.getPlaylists()
            .subscribe(data => {
                if (data.status === 'success') {
                    this.playlists = data.data;
                } else {
                    console.log('error');
                }
            })
    }

}
