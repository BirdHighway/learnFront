import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';
import { NounWord } from 'src/app/models/words/noun-word.model';
import { RestDataSource } from 'src/app/models/rest.datasource';

@Component({
    selector: 'app-noun',
    templateUrl: './noun.component.html',
    styleUrls: ['./noun.component.scss']
})
export class NounComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();
    isWordMastered: boolean = false;
    savePending: boolean;
    saveDivText: string = '';

    constructor(private dataSource: RestDataSource) { }

    ngOnInit() {
        this.isWordMastered = this.data.mastered;
        this.savePending = false;
        if (!this.data.data_noun) {
            this.data.data_noun = new NounWord();
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

    saveEdit() {
        this.savePending = true;
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
