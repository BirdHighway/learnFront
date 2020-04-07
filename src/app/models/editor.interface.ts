import { EventEmitter } from '@angular/core';
import { EditorEvent } from './editor-event.interface';

export interface EditorInterface {
    ngOnDestroy(),
    toggleMastered(),
    saveEdit(),
    cancelEdit(),
    editorEvent: EventEmitter<EditorEvent>,
    data: any,
    isWordMastered: boolean,
    savePending: boolean,
    saveDivText: string
}