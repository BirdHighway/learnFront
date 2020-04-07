import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';

@Component({
    selector: 'app-default',
    templateUrl: './default.component.html',
    styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();
    isWordMastered: boolean;
    savePending: boolean;
    saveDivText: string;

    constructor() { }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

    forward(destination: string) {
        this.data.type = destination;
        this.editorEvent.emit({action: 'forward', data: this.data});
    }

    toggleMastered() { }

    saveEdit() { }

    cancelEdit() {
        this.editorEvent.emit({action: 'cancel', data: {}});
    }

}
