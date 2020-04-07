import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from '../../models/editor-event.interface';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { OtherWord } from 'src/app/models/words/other-word.model';

@Component({
    selector: 'app-other',
    templateUrl: './other.component.html',
    styleUrls: ['./other.component.scss']
})
export class OtherComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
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
        }
        this.savePending = false;
        if (!this.data.data_other) {
            this.data.data_other = new OtherWord();
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
        if (audioName === 'a_word_audio') {
            src = this.data.data_other.a_word_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        }
    }

    saveEdit() {
        this.savePending = true;
        this.data.tags = this.tagString.replace(' ', '').split(',');
        this.saveDivText = 'Saving edit...';
        this.dataSource.updateVocab(this.data)
            .subscribe( data => {
                console.log(data);
                if (data.status === 'success') {
                    this.editorEvent.emit({action: 'save', data: {}});
                } else {
                    this.saveDivText = 'Error: ' + data.data;
                }
            })
    }

    cancelEdit() {
        this.editorEvent.emit({action: 'cancel', data: {}});
    }

}
