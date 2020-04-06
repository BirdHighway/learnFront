import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';

@Component({
    selector: 'app-verb',
    templateUrl: './verb.component.html',
    styleUrls: ['./verb.component.scss']
})
export class VerbComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();

    constructor() { }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

}
