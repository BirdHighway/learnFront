import { EventEmitter } from '@angular/core';
import { EditorEvent } from './editor-event.interface';
import { Playlist } from './playlist.model';

export interface EditorInterface {
    ngOnDestroy(),
    toggleMastered(),
    saveEdit(),
    cancelEdit(),
    editorEvent: EventEmitter<EditorEvent>,
    data: any,
    playlists: Playlist[],
    isWordMastered: boolean,
    savePending: boolean,
    saveDivText: string
}