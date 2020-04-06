import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';

@Component({
    selector: 'app-adjective',
    templateUrl: './adjective.component.html',
    styleUrls: ['./adjective.component.scss']
})
export class AdjectiveComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

}
