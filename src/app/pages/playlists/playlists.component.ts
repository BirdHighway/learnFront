import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';
import { PlaylistData } from 'src/app/models/playlist-data.model';

@Component({
    selector: 'app-playlists',
    templateUrl: './playlists.component.html',
    styleUrls: ['./playlists.component.scss']
})
export class PlaylistsComponent implements OnInit {

    playlists: Playlist[] = [];
    playlistDataSets: PlaylistData[] = [];
    dataReady: boolean = false;
    dataSetsReady: boolean = false;
    showCreate: boolean = false;
    newPlaylist: Playlist;
    savingPlaylist: boolean = false;

    constructor(private dataSource: RestDataSource) { }

    ngOnInit() {
        this.newPlaylist = new Playlist();
        this.loadPlaylists();
    }

    loadPlaylists() {
        this.dataReady = false;
        this.playlists = [];
        this.dataSource.getFullPlaylistData()
            .subscribe(response => {
                if (response.status === 'success') {
                    this.playlistDataSets = response.data;
                    this.dataSetsReady = true;
                } else {
                    console.error(response);
                }
            })
        this.dataSource.getPlaylists()
            .subscribe(response => {
                if (response.status === 'success') {
                    this.playlists = response.data;
                    this.dataReady = true;
                } else {
                    console.log(response);
                }
            })
    }

    mastPercentage(playlistData: PlaylistData): string {
        if (playlistData.mastered == 0) {
            return '0%';
        }
        return Math.floor((playlistData.mastered / playlistData.total) * 100) + '%';
    }

    unmastPracticePer(playlistData: PlaylistData): string {
        let unMast = playlistData.total - playlistData.mastered;
        if ((unMast == 0) || (isNaN(unMast))) {
            return '-';
        }
        return Math.floor((playlistData.totalUnmastPract / unMast) * 100) + '%';
    }

    getProgressInteger(playlistData: PlaylistData, field: string): number {
        if ( (playlistData.mastered == 0) || (playlistData.totalUnmastPract == 0)) {
            return 0;
        }
        let mastPercent = Math.floor((playlistData.mastered / playlistData.total) * 100);
        if (field === 'mastered') {
            return mastPercent;
        } else if (field === 'unmastered') {
            return 100 - mastPercent;
        }
    }

    doPercent(part: number, whole: number): number {
        if ((part == 0) || (whole == 0)) {
            return 0;
        }
        return Math.floor((part / whole) * 100);
    }

    absoluteProgress(playlistData: PlaylistData, field: string): number {
        let maxPossible = 100;
        let mastered = playlistData.mastered;
        let unmastered = playlistData.total - playlistData.mastered;
        if (field === 'mastered') {
            return this.doPercent(mastered, maxPossible);
        } else if (field === 'unmastered') {
            return this.doPercent(unmastered, maxPossible);
        }
        return 0;
    }

    getSizeInteger(playlistData: PlaylistData): number {
        if (playlistData.total == 0) {
            return 0;
        }
        return Math.floor((playlistData.total / 120) * 100);
    }

    createNewPlaylist() {
        this.newPlaylist = new Playlist();
        this.showCreate = true;
    }

    editPlaylist(playlist: Playlist) {
        this.showCreate = true;
        this.newPlaylist = new Playlist(playlist._id, playlist.name, playlist.created, playlist.order);
    }

    cancelSave() {
        this.newPlaylist = new Playlist();
        this.savingPlaylist = false;
        this.showCreate = false;
    }

    savePlaylist() {
        this.savingPlaylist = true;
        if (this.newPlaylist._id) {
            // update existing playlist
            let update = {
                playlist_id: this.newPlaylist._id,
                playlist_name: this.newPlaylist.name,
                order: this.newPlaylist.order
            }
            this.dataSource.updatePlaylist(update)
                .subscribe(response => {
                    if (response.status === 'success') {
                        this.loadPlaylists();
                        this.savingPlaylist = false;
                        this.showCreate = false;
                    } else {
                        console.error(response);
                    }
                })
        } else {
            // create new playlist
            this.dataSource.createPlaylist(this.newPlaylist)
                .subscribe(response => {
                    if (response.status === 'success') {
                        this.loadPlaylists();
                        this.savingPlaylist = false;
                        this.showCreate = false;
                    } else {
                        console.error(response);
                    }
                })
        }
    }

    deletePlaylist() {
        this.savingPlaylist = true;
        if (confirm('Are you sure you want to delete this playlist?')) {
            // delete playlist
            this.dataSource.deletePlaylist(this.newPlaylist)
                .subscribe(data => {
                    if (data.status === 'success') {
                        let index = this.playlists.findIndex((p) => p._id === this.newPlaylist._id);
                        this.playlists.splice(index, 1);
                        this.newPlaylist = new Playlist();
                        this.showCreate = false;
                        this.savingPlaylist = false;
                    } else {
                        console.log(data);
                    }
                })
        } else {
            this.savingPlaylist = false;
            return;
        }
    }

}
