import { Component, OnInit, ViewChild, ComponentFactoryResolver, OnDestroy, Inject, LOCALE_ID } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Word } from 'src/app/models/words/word.model';
import { EditorDirective } from 'src/app/directives/editor.directive';
import { NounComponent } from 'src/app/editors/noun/noun.component';
import { VerbComponent } from 'src/app/editors/verb/verb.component';
import { AdjectiveComponent } from 'src/app/editors/adjective/adjective.component';
import { OtherComponent } from 'src/app/editors/other/other.component';
import { EditorInterface } from 'src/app/models/editor.interface';
import { DefaultComponent } from 'src/app/editors/default/default.component';
import { EditorEvent } from 'src/app/models/editor-event.interface';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { PaginationObject } from 'src/app/models/pagination.model';
import { Playlist } from 'src/app/models/playlist.model';
import { ActivatedRoute } from '@angular/router';
import { AdjectiveWord } from 'src/app/models/words/adjective-word.model';
import { DatePipe, formatDate } from '@angular/common';

@Component({
    selector: 'app-vocab',
    templateUrl: './vocab.component.html',
    styleUrls: ['./vocab.component.scss']
})
export class VocabComponent implements OnInit, OnDestroy {

    words: Word[];
    page: number;
    showEntriesTable: boolean;
    showEntriesFilter: boolean;
    showEditForm: boolean;
    pagination: PaginationObject[];
    resultsCount: number;
    categoryFilter: string;
    searchText: string;
    searchTarget: string;
    excludeTag: string;
    playlists: Playlist[];
    playlistSelected: string;
    queryPlaylistName: string;
    queryPage: number;
    bulkPlaylistMode: boolean;
    bulkPlaylistId: string;
    bulkPlaylistName: string;
    bulkPlaylistWords: string[];
    bulkPlaylistRemovals: string[];
    lastEnglishAudioFile: string;
    lastArabicAudioFile: string;
    srcRegExp: RegExp;

    @ViewChild(EditorDirective, {static: true}) editorHost: EditorDirective;

    constructor(
        private dataSource: RestDataSource,
        private componentFactoryResolver: ComponentFactoryResolver,
        private audioPlayer: AudioPlayerService,
        private route: ActivatedRoute,
        @Inject(LOCALE_ID) private locale: string
    ) {
        this.words = [];
        this.page = 1;
        this.showEntriesTable = false;
        this.showEntriesFilter = true;
        this.showEditForm = true;
        this.pagination = [];
        this.resultsCount = 0;
        this.categoryFilter = 'all';
        this.searchText = '';
        this.searchTarget = 'tags';
        this.excludeTag = 'none';
        this.playlists = [];
        this.playlistSelected = 'none';
        this.queryPlaylistName = '';
        this.queryPage = 1;
        this.bulkPlaylistMode = false;
        this.bulkPlaylistId = '';
        this.bulkPlaylistName = '';
        this.bulkPlaylistWords = [];
        this.bulkPlaylistRemovals = [];
        this.lastEnglishAudioFile = '';
        this.lastArabicAudioFile = '';
        this.srcRegExp = new RegExp('(.*[^[0-9]+)([0]*)([0-9]+)\.(.+)');
    }

    ngOnInit() {
        this.route.queryParams
            .subscribe(q => {
                if (q.playlist) {
                    console.log(q.playlist);
                    this.queryPlaylistName = q.playlist;
                    let index = this.playlists.findIndex(p => p.name == this.queryPlaylistName);
                    if (index !== -1) {
                        this.playlistSelected = this.playlists[index]._id;
                    } else {
                        console.log('error, playlist not identified');
                    }
                } else {
                    this.queryPlaylistName = '';
                    this.playlistSelected = 'none';
                }
                this.loadEntries();
            })
        this.dataSource.getPlaylists()
            .subscribe(response => {
                this.playlists = response.data;
                if (this.queryPlaylistName) {
                    let index = this.playlists.findIndex(p => p.name === this.queryPlaylistName);
                    if (index !== -1) {
                        this.playlistSelected = this.playlists[index]._id;
                        this.loadEntries();
                    }
                }
            })

    }

    ngOnDestroy() {
        console.log('ngOnDestroy()');
        this.audioPlayer.doKillSequence();
    }

    getPaginationObjects(): PaginationObject[] {
        return this.pagination;
    }

    createNewVocab() {
        this.edit(new Word());
    }

    edit(word: Word) {
        this.showEntriesTable = false;
        this.showEntriesFilter = false;
        let component;
        if (word.type === 'noun') {
            component = NounComponent;
        } else if (word.type === 'verb') {
            component = VerbComponent;
        } else if (word.type === 'adjective') {
            component = AdjectiveComponent;
        } else if (word.type === 'other') {
            component = OtherComponent;
        } else {
            component = DefaultComponent;
        }
        const componentFactory = this.componentFactoryResolver.resolveComponentFactory(component);
        const viewContainerRef = this.editorHost.viewContainerRef;
        viewContainerRef.clear();
        const componentRef = viewContainerRef.createComponent(componentFactory);
        const editorInstance = (<EditorInterface>componentRef.instance);
        editorInstance.data = word;
        console.log(this.playlists);
        editorInstance.playlists = this.playlists;
        editorInstance.lastEnglish = this.lastEnglishAudioFile;
        editorInstance.lastArabic = this.lastArabicAudioFile;
        const sub = editorInstance.editorEvent.subscribe( (event: EditorEvent) => {
            if (event.action === 'destruction') {
                sub.unsubscribe();
                console.log('unsubscribe() on destruction event');
            }
            if (event.action === 'forward') {
                this.edit(event.data);
            }
            if (event.action === 'cancel') {
                componentRef.destroy();
                this.showEntriesTable = true;
                this.showEntriesFilter = true;
            }
            if (event.action === 'save') {
                this.lastEnglishAudioFile = this.incrementAudioFile(event.data.lastEnglish);
                this.lastArabicAudioFile = this.incrementAudioFile(event.data.lastArabic);
                componentRef.destroy();
                this.showEntriesTable = true;
                this.showEntriesFilter = true;
            }
            if (event.action === 'audio-preview') {
                this.playAudio(event.data);
            }
            if (event.action === 'delete') {
                this.loadEntries();
            }
        });
    }

    incrementAudioFile(src: string) {
        if (src.length == 0) {
            return '';
        }
        let matches = src.match(this.srcRegExp);
        if (!matches) {
            return '';
        }
        let base = matches[1];
        let z = matches[2];
        let zero = '0';
        let newZ = '';
        let n = matches[3];
        let ext = matches[4];
        let newNum = parseInt(n) + 1;
        if (z.length != 0) {
            if (newNum % 10 == 0) {
                newZ = zero.repeat(z.length - 1);
            } else {
                newZ = zero.repeat(z.length);
            }
        }
        return `${base}${newZ}${newNum}.${ext}`;
    }

    forward(event: Word) {
        this.edit(event);
    }

    loadEntries() {
        this.loadPage(this.page);
    }

    encodePlaylistName(playlist) {
        return encodeURIComponent(playlist.playlist_name);
    }

    makeQueryString(pageNumber: number): string {
        let queryString = `page=${pageNumber}&category=${this.categoryFilter}`;
        if (this.searchText.length) {
            let encodedSearch = encodeURIComponent(this.searchText);
            queryString += `&searchText=${encodedSearch}&searchTarget=${this.searchTarget}`;
        }
        if (this.excludeTag !== 'none') {
            queryString += `&excludeTag=${this.excludeTag}`;
        }
        if (this.playlistSelected !== 'none') {
            queryString += `&playlist=${this.playlistSelected}`;
        }
        return queryString;
    }

    loadPage(pageNumber) {
        let queryString = this.makeQueryString(pageNumber);
        this.dataSource.getVocab(queryString)
            .subscribe(data => {
                if (data.status == 'success') {
                    this.words = data.data;
                    this.setPagination(data.total, data.page);
                    this.bulkModeExit();
                    this.showEntriesTable = true;
                    this.resultsCount = data.total;
                } else {
                    console.log('Error');
                }
            })
    }

    setPagination(total: number, current: number) {
        this.pagination = [];
        let totalPages,
            navStart,
            navTotal,
            navMax;
        totalPages = Math.ceil(total / 50);
        if (current > 10) {
            navStart = current - 3;
        } else {
            navStart = 1;
        }
        if (totalPages < 11) {
            navTotal = totalPages;
        } else {
            navTotal = 10;
        }
        navMax = navStart + navTotal;
        for(let i=navStart; i<navMax; i++){
            this.pagination.push(new PaginationObject(i, i, (i == current)) );
        }

    }

    englishText(fullText: string): string {
        if (fullText && fullText.length > 25) {
            return fullText.substr(0,25) + '...';
        } else {
            return fullText;
        }
    }

    masteredText(isMastered: boolean): string {
        if (isMastered) {
            return 'Y';
        } else {
            return '-';
        }
    }

    lastPracticedText(last: string, ever: boolean): string {
        if (ever) {
            return formatDate(new Date(last), 'MMM d, h:mm a', this.locale);
        } else {
            return '-';
        }
    }

    defaultAudio(word: Word): string {
        switch(word.type) {
            case 'noun':
                return word.data_noun.a_sing_audio;
            case 'verb':
                return word.data_verb.a_past_3sm_audio;
            case 'adjective':
                return word.data_adj.a_masc_audio;
            case 'other':
                return word.data_other.a_word_audio;
            default:
                return '';
        }
    }

    defaultText(word: Word): string {
        switch(word.type) {
            case 'noun':
                return word.data_noun.a_sing_text;
            case 'verb':
                return word.data_verb.a_past_3sm_text;
            case 'adjective':
                return word.data_adj.a_masc_text;
            case 'other':
                return word.data_other.a_word_text;
            default:
                return '';
        }
    }

    playAudio(audioString: string) {
        if (!audioString) {
            return false;
        }
        const baseString = 'vocab_audio/';
        this.audioPlayer.playFromSource(baseString + audioString);
    }

    bulkModeEnter() {
        let index = this.playlists.findIndex(p => p._id === this.bulkPlaylistId);
        if (index === -1) {
            return;
        }
        this.bulkPlaylistName = this.playlists[index].name;
        this.bulkUpdateMarked();
        this.bulkPlaylistWords = [];
        this.bulkPlaylistRemovals = [];
        this.bulkPlaylistMode = true;
    }

    bulkUpdateMarked() {
        for (let i=0; i<this.words.length; i++) {
            if (this.words[i].memberships.findIndex(m => m.playlist_id === this.bulkPlaylistId) !== -1) {
                this.words[i].bulkSelected = true;
                this.words[i].bulkWasSelected = true;
            }
        }
    }

    bulkModeExit() {
        this.bulkPlaylistMode = false;
        this.bulkPlaylistId = '';
        for (let i=0; i<this.words.length; i++) {
            this.words[i].bulkSelected = false;
            this.words[i].bulkWasSelected = false;
        }
        this.bulkPlaylistWords = [];
        this.bulkPlaylistRemovals = [];
    }

    bulkModeSave() {
        console.log('Add:');
        console.log(this.bulkPlaylistWords);
        console.log('Remove:');
        console.log(this.bulkPlaylistRemovals);
        let bulkUpdate = {
            playlist_id: this.bulkPlaylistId,
            playlist_name: this.bulkPlaylistName,
            additions: this.bulkPlaylistWords,
            removals: this.bulkPlaylistRemovals
        }
        this.dataSource.bulkUpdatePlaylist(bulkUpdate)
            .subscribe(data => {
                if (data.status === 'success') {
                    console.log('Success');
                    this.loadEntries();
                } else {
                    console.log('Error');
                    console.log(data);
                }
            })
    }

    addToBulk(word: Word) {
        if (!this.bulkPlaylistMode) {
            return;
        }
        if (word.bulkSelected) {
            // already selected
            // remove from selected
            if (word.bulkWasSelected) {
                this.bulkPlaylistRemovals.push(word._id);
            }
            word.bulkSelected = false;
            let index = this.bulkPlaylistWords.findIndex(s => s === word._id);
            if (index !== -1) {
                this.bulkPlaylistWords.splice(index, 1);
            }
        } else {
            // add to selected
            word.bulkSelected = true;
            if (word.bulkWasSelected) {
                let index = this.bulkPlaylistRemovals.indexOf(word._id);
                this.bulkPlaylistRemovals.splice(index, 1);
            } else {
                this.bulkPlaylistWords.push(word._id);
            }
        }
    }
}
