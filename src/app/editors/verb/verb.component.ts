import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { EditorInterface } from 'src/app/models/editor.interface';
import { Word } from 'src/app/models/words/word.model';
import { EditorEvent } from 'src/app/models/editor-event.interface';
import { VerbWord } from 'src/app/models/words/verb-word.model';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';
import { MembershipUpdate } from 'src/app/models/membership-update.model';

@Component({
    selector: 'app-verb',
    templateUrl: './verb.component.html',
    styleUrls: ['./verb.component.scss']
})
export class VerbComponent implements OnInit, EditorInterface, OnDestroy {

    @Input() data: Word;
    @Input() playlists: Playlist[];
    @Input() lastEnglish: string;
    @Input() lastArabic: string;
    @Output() editorEvent: EventEmitter<EditorEvent> = new EventEmitter();
    @ViewChild("tab1", {static: false}) tab1: ElementRef;
    @ViewChild("tab2", {static: false}) tab2: ElementRef;
    isWordMastered: boolean = false;
    isActive: boolean = true;
    savePending: boolean;
    saveDivText: string = '';
    originalPlaylistId: string;
    selectedPlaylistId: string;
    srcRegExp = new RegExp('(.*[^[0-9]+)([0]*)([0-9]+)\.(.+)');

    constructor(private dataSource: RestDataSource) {
        this.originalPlaylistId = 'none';
        this.selectedPlaylistId = 'none';
    }

    ngOnInit() {
        this.isWordMastered = this.data.mastered;
        if (this.data.playlist) {
            this.originalPlaylistId = this.data.playlist.playlist_id;
            this.selectedPlaylistId = this.data.playlist.playlist_id;
        } else {
            this.originalPlaylistId = 'none';
            this.selectedPlaylistId = 'none';
        }
        this.savePending = false;
        if (!this.data.data_verb) {
            this.data.data_verb = new VerbWord();
            this.data.dialect = 'Lebanese';
            this.data.source = 'Lebanese Vocab Book';
            this.data.eng_audio = this.lastEnglish;
            this.data.data_verb.a_past_3sm_audio = this.lastArabic;
            this.data.playlist = {}
        }
        this.isWordMastered = this.data.mastered;
        this.isActive = this.data.isActive;
    }

    ngOnDestroy() {
        this.editorEvent.emit({action: 'destruction', data: {}})
    }

    toggleActive() {
        this.isActive = !this.isActive;
        this.data.isActive = this.isActive;
    }

    toggleMastered() {
        this.isWordMastered = !this.isWordMastered;
        this.data.mastered = this.isWordMastered;
    }

    previewAudio(audioName: string) {
        let src = '';
        if (audioName === 'a_past_3sm_audio') {
            src = this.data.data_verb.a_past_3sm_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if (audioName === 'a_pres_3sm_audio') {
            src = this.data.data_verb.a_pres_3sm_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        } else if (audioName === 'english') {
            src = this.data.eng_audio;
            this.editorEvent.emit({action: 'audio-preview', data: src});
        }
    }

    saveEdit(multipleEdits: boolean) {
        this.savePending = true;
        this.saveDivText = 'Saving edit...';
        let lastEnglish = this.data.eng_audio;
        let lastArabic = '';
        if (this.originalPlaylistId != this.selectedPlaylistId) {
            let newPlaylist = this.playlists.find(p => (p._id === this.selectedPlaylistId));
            this.data.playlist.playlist_id = newPlaylist._id;
            this.data.playlist.order = newPlaylist.order;
            this.data.playlist.playlist_name = newPlaylist.name;
        }
        if (this.data.data_verb.a_pres_3sm_audio) {
            lastArabic = this.data.data_verb.a_pres_3sm_audio;
        } else if (this.data.data_verb.a_past_3sm_audio) {
            lastArabic = this.data.data_verb.a_past_3sm_audio;
        }        
        this.dataSource.updateVocab(this.data)
            .subscribe( data => {
                console.log(data);
                if (data.status === 'success') {
                    this.editorEvent.emit({action: 'save', data: {
                        lastEnglish: lastEnglish,
                        lastArabic: lastArabic,
                        multipleEdits: multipleEdits
                    }});
                } else {
                    this.saveDivText = 'Error: ' + data.data;
                }
            })
    }

    deleteWord() {
        if (confirm("Are you sure you want to delete this entry?")) {
            this.savePending = true;
            this.dataSource.deleteVocab(this.data)
                .subscribe(data => {
                    this.editorEvent.emit({action: 'delete', data: {}});
                })
        } else {
            return;
        }
    }

    cancelEdit() {
        this.editorEvent.emit({action: 'cancel', data: {}});
    }

    clearInput(audioName: string) {
        if (audioName === 'english') {
            this.data.eng_audio = null;
        } else if (audioName === 'a_past_3sm_audio') {
            this.data.data_verb.a_past_3sm_audio = '';
        } else if (audioName === 'a_pres_3sm_audio') {
            this.data.data_verb.a_pres_3sm_audio = '';
        }
    }

    increment(audioName: string) {
        this.unaryLogic(audioName, 'increment');
    }

    decrement(audioName: string) {
        this.unaryLogic(audioName, 'decrement');
    }

    unaryLogic(audioName: string, action: string) {
        if (audioName === 'english') {
            if (this.data.eng_audio) {
                this.data.eng_audio = this.doUnary(this.data.eng_audio, action);
            } else if (this.lastEnglish) {
                this.data.eng_audio = this.lastEnglish;
            }
        } else {
            let newValue = '';
            let past = this.data.data_verb.a_past_3sm_audio;
            let pres = this.data.data_verb.a_pres_3sm_audio;
            let aLast = this.lastArabic;
            if (aLast) {
                newValue = aLast;
            }
            if (audioName === 'a_past_3sm_audio') {
                if (past) {
                    newValue = this.doUnary(past, action);
                }
                this.data.data_verb.a_past_3sm_audio = newValue;
            } else if (audioName === 'a_pres_3sm_audio') {
                if (pres) {
                    newValue = this.doUnary(pres, action);
                } else if (past) {
                    newValue = this.doUnary(past, action);
                }
                this.data.data_verb.a_pres_3sm_audio = newValue;
            }
        }
    }

    doUnary(fileName: string, action: string): string {
        if (fileName.length == 0) {
            return '';
        }
        let matches = fileName.match(this.srcRegExp);
        if (!matches) {
            return '';
        }
        let base = matches[1];
        let newZ = '';
        let n = matches[3];
        let ext = matches[4];
        let newNum = 0;
        if (action === 'increment') {
            newNum = parseInt(n) + 1;
        } else {
            newNum = parseInt(n) - 1;
        }
        if (newNum < 10) {
            newZ = '0';
        }
        return `${base}${newZ}${newNum}.${ext}`;
    }

    tabTo(destination: number) {
        if (destination == 1) {
            this.tab1.nativeElement.focus();
        } else if (destination == 2) {
            this.tab2.nativeElement.focus();
        }
    }
}
