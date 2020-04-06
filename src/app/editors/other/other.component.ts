import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from '../../models/editor-event.interface';

@Component({
    selector: 'app-other',
    templateUrl: './other.component.html',
    styleUrls: ['./other.component.scss']
})
export class OtherComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();
    constructor() { }

    ngOnInit() {
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

}
