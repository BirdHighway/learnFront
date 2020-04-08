import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';
import { AdjectiveWord } from 'src/app/models/words/adjective-word.model';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';
import { MembershipUpdate } from '../../models/membership-update.model';

@Component({
    selector: 'app-adjective',
    templateUrl: './adjective.component.html',
    styleUrls: ['./adjective.component.scss']
})
export class AdjectiveComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Input() playlists: Playlist[];
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
        if (!this.data.data_adj) {
            this.data.data_adj = new AdjectiveWord();
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
        if (audioName === 'a_masc_audio') {
            src = this.data.data_adj.a_masc_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if ( audioName === 'a_fem_audio') {
            src = this.data.data_adj.a_fem_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if ( audioName === 'a_pl_audio') {
            src = this.data.data_adj.a_pl_audio;
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

    playlistAdd(playlist: Playlist) {
        let updateObject = {
            action: 'add',
            vocab_id: this.data._id,
            playlist_id: playlist._id,
            playlist_name: playlist.name
        }
        this.playlistDoUpdate(updateObject);
    }

    playlistRemove(playlist: Playlist) {
        let updateObject = {
            action: 'remove',
            vocab_id: this.data._id,
            playlist_id: playlist._id,
            playlist_name: playlist.name
        }
        this.playlistDoUpdate(updateObject);
    }

    playlistDoUpdate(update: MembershipUpdate) {
        this.dataSource.updateMembership(update)
            .subscribe(data => {
                if (data.status === 'success') {
                    this.data.memberships = data.data.memberships;
                } else {
                    console.log('Error');
                    console.log(data);
                }
            })
    }

    playlistMembershipClasses(playlist: Playlist): string {
        let index = this.data.memberships.findIndex( m => m.playlist_id === playlist._id);
        if (index !== -1) {
            return 'list-group-item list-group-item-success';
        } else {
            return 'list-group-item';
        }
    }

    playlistIsMember(playlistId: string): boolean {
        let index = this.data.memberships.findIndex( m => m.playlist_id === playlistId);
        return index !== -1;
    }

}
