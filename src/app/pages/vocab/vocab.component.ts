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

    @ViewChild(EditorDirective, {static: true}) editorHost: EditorDirective;

    constructor(
        private dataSource: RestDataSource,
        private componentFactoryResolver: ComponentFactoryResolver
    ) {
        this.words = [];
        this.page = 1;
        this.showEntriesTable = false;
        this.showEntriesFilter = true;
        this.showEditForm = true;
    }

    ngOnInit() {

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
        });
    }

    forward(event: Word) {
        this.edit(event);
    }

    loadEntries() {
        this.loadPage(this.page);
    }

    loadPage(pageNumber) {
        this.dataSource.getVocab(0)
        .subscribe(data => {
            this.words = data;
            this.showEntriesTable = true;
        })
    }
}
