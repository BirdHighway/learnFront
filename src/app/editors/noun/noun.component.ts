import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';
import { NounWord } from 'src/app/models/words/noun-word.model';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';
import { MembershipUpdate } from 'src/app/models/membership-update.model';

@Component({
    selector: 'app-noun',
    templateUrl: './noun.component.html',
    styleUrls: ['./noun.component.scss']
})
export class NounComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Input() playlists: Playlist[];
    @Input() lastEnglish: string;
    @Input() lastArabic: string;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();
    isWordMastered: boolean = false;
    tagString: string = '';
    savePending: boolean;
    saveDivText: string = '';

    constructor(private dataSource: RestDataSource) { }

    ngOnInit() {
        this.isWordMastered = this.data.mastered;
        if (this.data.tags) {
            this.tagString = this.data.tags.join(', ');
        } else {
            this.tagString = '';
        }
        this.savePending = false;
        if (!this.data.data_noun) {
            this.data.data_noun = new NounWord();
            this.data.dialect = 'Lebanese';
            this.data.source = 'Lebanese Vocab Book';
            this.data.eng_audio = this.lastEnglish;
            this.data.data_noun.a_sing_audio = this.lastArabic;
            this.data.playlist = {}
        }
        this.isWordMastered = this.data.mastered;
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

    toggleMastered() {
        this.isWordMastered = !this.isWordMastered;
        this.data.mastered = this.isWordMastered;
    }

    previewAudio(audioName: string) {
        let src = '';
        if (audioName === 'a_sing_audio') {
            src = this.data.data_noun.a_sing_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if (audioName === 'a_pl_audio') {
            src = this.data.data_noun.a_pl_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if (audioName === 'english') {
            src = this.data.eng_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        }
    }

    saveEdit(multipleEdits: boolean) {
        this.savePending = true;
        this.data.tags = this.tagString.replace(' ', '').split(',');
        this.saveDivText = 'Saving edit...';
        let lastEnglish = this.data.eng_audio;
        let lastArabic = '';
        if (this.data.data_noun.a_pl_audio) {
            lastArabic = this.data.data_noun.a_pl_audio;
        } else if (this.data.data_noun.a_sing_audio) {
            lastArabic = this.data.data_noun.a_sing_audio;
        }          
        this.dataSource.updateVocab(this.data)
            .subscribe( data => {
                console.log(data);
                if (data.status === 'success') {
                    this.editorEvent.emit({action: 'save', data: {
                        lastEnglish: lastEnglish,
                        lastArabic: lastArabic,
                        multipleEdits: multipleEdits
                    }});
                } else {
                    this.saveDivText = 'Error: ' + data.data;
                }
            })
    }

    cancelEdit() {
        this.editorEvent.emit({action: 'cancel', data: {}});
    }

}
