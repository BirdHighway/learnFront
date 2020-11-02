import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Noun } from './noun.model';
import { Environment } from '../environment';
import { Word } from './words/word.model';
import { ApiResponse } from './api-response.model';
import { Playlist } from './playlist.model';
import { PlaylistUpdate } from './playlist-update.interface';
import { MembershipUpdate } from './membership-update.model';
import { MembershipUpdateBulk } from './membership-update-bulk.model';
import { VerbSet } from './verb-sets/verb-set.model';
import { StatusUpdateBulk } from './status-update-bulk.model';

@Injectable()
export class RestDataSource {
    baseUrl: string;

    constructor(private http: HttpClient) {
        this.baseUrl = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/`;
    }

    /****************************************************************************************
    /   VERB SETS
    */
    getVerbs(queryString: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(this.baseUrl + 'verbs/?' + queryString);
    }

    getVerbCollection(queryString: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(this.baseUrl + `verbs/collections/?${queryString}`);
    }

    updateVerb(verb: VerbSet): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(this.baseUrl + 'verbs/', verb);
    }

    touchVerb(id: string): Observable<ApiResponse> {
        console.log('touchVerb()');
        return this.http.patch<ApiResponse>(this.baseUrl + 'verbs/touch', {_id: id});
    }

    /*****************************************************************************************
    /   VOCAB
    */

    getVocab(queryString: string, limit = 0): Observable<ApiResponse> {
        let url = ``;
        if (limit) {
            url = `${this.baseUrl}vocab/random/?limit=${limit}`;
        } else {
            url = `${this.baseUrl}vocab/?${queryString}&display=true`;
        }
        return this.http.get<ApiResponse>(url);
    }

    getStudyVocab(queryString: string, limit = 0): Observable<ApiResponse> {
        let url = ``;
        if (limit) {
            url = `${this.baseUrl}vocab/random/?limit=${limit}`;
        } else {
            url = `${this.baseUrl}vocab/?${queryString}&active=true`;
        }
        return this.http.get<ApiResponse>(url);        
    }

    getFlashcardVocab(queryString: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}vocab/flashcards/?${queryString}`);
    }

    updateVocab(word: Word): Observable<ApiResponse> {
        if (word._id) {
            return this.http.patch<ApiResponse>(this.baseUrl + 'vocab', word);
        } else {
            return this.http.post<ApiResponse>(this.baseUrl + 'vocab', word);
        }
    }

    deleteVocab(word: Word): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(this.baseUrl + `vocab/id/${word._id}`);
    }

    touchVocab(word: Word): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(this.baseUrl + `vocab/touch`, word);
    }

    touchVocabB(word: Word): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(this.baseUrl + `vocab/touch-b`, word);
    }

    /*****************************************************************************************
    /   PLAYLISTS
    */

    getPlaylists(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(this.baseUrl + 'playlist');
    }

    getFullPlaylistData(): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(this.baseUrl + 'playlist/full');
    }

    getOnePlaylist(playlistId: string): Observable<ApiResponse> {
        return this.http.get<ApiResponse>(`${this.baseUrl}playlist/id/${playlistId}`);
    }

    createPlaylist(name: string, order: number): Observable<ApiResponse> {
        let newPlaylist = {
            name: name,
            order: order
        }
        return this.http.post<ApiResponse>(this.baseUrl + 'playlist', newPlaylist); 
    }

    updatePlaylist(playlist: Playlist): Observable<ApiResponse> {
        return this.http.patch<ApiResponse>(this.baseUrl + 'playlist', playlist);
    }

    updatePlaylistOrder(playlistId: string, newPosition: number): Observable<ApiResponse> {
        let data = {
            _id: playlistId,
            order: newPosition
        };
        return this.http.patch<ApiResponse>(`${this.baseUrl}playlist/order`, data);
    }

    deletePlaylist(playlistId: string): Observable<ApiResponse> {
        return this.http.delete<ApiResponse>(this.baseUrl + `playlist/id/${playlistId}`);
    }


    bulkUpdatePlaylist(bulkUpdate: MembershipUpdateBulk): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(this.baseUrl + 'vocab/playlists', bulkUpdate);
    }

    bulkUpdateStatus(bulkUpdate: StatusUpdateBulk): Observable<ApiResponse> {
        return this.http.post<ApiResponse>(`${this.baseUrl}vocab/status`, bulkUpdate);
    }








    /*****************************************************************************************
    /   EARLY VERSION REMNANTS
    */

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

    getNounObservable(id: string): Observable<Noun> {
        return this.http.get<Noun>(this.baseUrl + 'nouns/id/' + id);
    }

    updateNoun(noun: Noun): Observable<Noun> {
        return this.http.patch<Noun>(this.baseUrl + 'nouns',noun);
    }
}