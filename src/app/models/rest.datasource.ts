import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Noun } from './noun.model';
import { Environment } from '../environment';
import { GenericPrompt } from '../models/generic.model';
import { Word } from './words/word.model';
import { ApiResponse } from './api-response.model';

@Injectable()
export class RestDataSource {
    baseUrl: string;

    constructor(private http: HttpClient) {
        this.baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    }

    getVocab(queryString: string,): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(this.baseUrl + 'vocab/?' + queryString);
    }

    updateVocab(word: Word): Observable<ApiResponse> {
        if (word._id) {
            return this.http.patch<ApiResponse>(this.baseUrl + 'vocab', word);
        } else {
            return this.http.post<ApiResponse>(this.baseUrl + 'vocab', word);
        }
    }

    getNouns(): Observable<Noun[]> {
        return this.http.get<Noun[]>(this.baseUrl + 'nouns');
    }

    getCategory(category: string): Observable<Noun[]> {
        return this.http.get<Noun[]>(this.baseUrl + 'nouns/category/' + category);
    }

    saveNoun(noun: Noun): Observable<Noun> {
        return this.http.post(this.baseUrl + 'nouns', noun);
    }

    saveTags(tag: string, ids: string[]): Observable<any> {
        let data = {
            "ids": ids,
            "tag": tag
        }
        return this.http.post(this.baseUrl + 'tags/add', data);
    }

    doSaveGenericEntries(entriesArray): Observable<any> {
        console.log('doSaveGenericEntries()');
        return this.http.post(this.baseUrl + 'generics', entriesArray);
    }

    getGenerics(): Observable<GenericPrompt[]> {
        return this.http.get<GenericPrompt[]>(this.baseUrl + 'generics');
    }

    getNounObservable(id: string): Observable<Noun> {
        return this.http.get<Noun>(this.baseUrl + 'nouns/id/' + id);
    }

    updateNoun(noun: Noun): Observable<Noun> {
        return this.http.patch<Noun>(this.baseUrl + 'nouns',noun);
    }
}