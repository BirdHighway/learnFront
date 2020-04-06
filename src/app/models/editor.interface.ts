import { EventEmitter } from '@angular/core';
import { EditorEvent } from './editor-event.interface';

export interface EditorInterface {
    ngOnDestroy(),
    editorEvent: EventEmitter<EditorEvent>,
    data: any
}