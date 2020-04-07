import { Component, OnInit, ViewChild, ComponentFactoryResolver } from '@angular/core';
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

@Component({
    selector: 'app-vocab',
    templateUrl: './vocab.component.html',
    styleUrls: ['./vocab.component.scss']
})
export class VocabComponent implements OnInit {

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

    @ViewChild(EditorDirective, {static: true}) editorHost: EditorDirective;

    constructor(
        private dataSource: RestDataSource,
        private componentFactoryResolver: ComponentFactoryResolver,
        private audioPlayer: AudioPlayerService
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
    }

    ngOnInit() {

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
                componentRef.destroy();
                this.showEntriesTable = true;
                this.showEntriesFilter = true;
            }
            if (event.action === 'audio-preview') {
                this.playAudio(event.data);
            }
        });
    }

    forward(event: Word) {
        this.edit(event);
    }

    loadEntries() {
        this.loadPage(this.page);
    }

    makeQueryString(pageNumber: number): string {
        let queryString = `page=${pageNumber}&category=${this.categoryFilter}`;
        if (this.searchText.length) {
            let encodedSearch = encodeURIComponent(this.searchText);
            queryString += `&searchText=${encodedSearch}&searchTarget=${this.searchTarget}`;
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
        totalPages = Math.ceil(total / 20);
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

    playAudio(audioString: string) {
        if (!audioString) {
            return false;
        }
        const baseString = 'vocab_audio/';
        this.audioPlayer.playFromSource(baseString + audioString);
    }
}
