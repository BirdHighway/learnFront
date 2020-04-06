import { Injectable } from '@angular/core';
import { Noun } from './noun.model';
import { RestDataSource } from './rest.datasource';
import { GenericPrompt } from './generic.model';
import { Observable } from 'rxjs';

@Injectable()
export class VocabRepository {

    private nouns: Noun[];

    constructor(private dataSource: RestDataSource) {
        this.nouns = [];
        dataSource.getNouns().subscribe(data => {
            this.nouns = data;
        })
    }

    getNouns(): Noun[] {
        return this.nouns;
    }

    getSingleNoun(nounId: string): Noun {
        return this.nouns.find( n => n._id == nounId);
    }

    getNounObservable(nounId: string): Observable<Noun> {
        return this.dataSource.getNounObservable(nounId);
    }

    saveNoun(noun: Noun) {
        this.dataSource.saveNoun(noun)
            .subscribe( (n) => {
                this.nouns.push(n);
                location.reload();
            })
    }

    saveTags(tag: string, ids: string[]) {
        this.dataSource.saveTags(tag, ids)
            .subscribe( (res) => {
                console.log(res);
            })
    }

    saveGenericEntries(entriesArray: []) {
        this.dataSource.doSaveGenericEntries(entriesArray)
            .subscribe( (res) => {
                console.log(res);
            })
    }

    getGenerics(): Observable<GenericPrompt[]> {
        return this.dataSource.getGenerics();
    }

    updateNoun(noun: Noun): Observable<Noun> {
        return this.dataSource.updateNoun(noun);
    }

}