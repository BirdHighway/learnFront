import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';

@Component({
    selector: 'app-playlists',
    templateUrl: './playlists.component.html',
    styleUrls: ['./playlists.component.scss']
})
export class PlaylistsComponent implements OnInit {

    playlists: Playlist[] = [];
    dataReady: boolean = false;
    showCreate: boolean = false;
    newPlaylist: Playlist;
    savingPlaylist: boolean = false;
    tagString: string = '';

    constructor(private dataSource: RestDataSource) { }

    ngOnInit() {
        this.newPlaylist = new Playlist();
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

    loadPlaylists() {

    }

    createNewPlaylist() {
        this.tagString = '';
        this.newPlaylist = new Playlist();
        this.showCreate = true;
    }

    editPlaylist(playlist: Playlist) {
        this.showCreate = true;
        if (playlist.tags) {
            this.tagString = playlist.tags.join(', ');
        } else {
            this.tagString = '';
        }
        this.newPlaylist = new Playlist(playlist._id, playlist.name, playlist.tags, playlist.created, playlist.count, playlist.mastered, playlist.order);
    }

    cancelSave() {
        this.newPlaylist = new Playlist();
        this.tagString = '';
        this.savingPlaylist = false;
        this.showCreate = false;
    }

    savePlaylist() {
        this.savingPlaylist = true;
        this.newPlaylist.tags = this.tagString.replace(' ', '').split(',');
        this.dataSource.updatePlaylist(this.newPlaylist)
            .subscribe(response => {
                if (response.status === 'success') {
                    let newPlaylist = response.data;
                    let index = this.playlists.findIndex((p) => p._id === newPlaylist._id);
                    if (index === -1) {
                        this.playlists.push(newPlaylist);
                        this.savingPlaylist = false;
                        this.showCreate = false;
                    } else {
                        this.playlists[index] = newPlaylist;
                        this.savingPlaylist = false;
                        this.showCreate = false;
                    }
                } else {
                    console.log(response);
                }
            })
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

    getPercentMastered(playlist: Playlist): string {
        let total = playlist.count;
        let mast = playlist.mastered;
        let share;
        if (total > 0) {
            share = Math.floor((mast / total) * 100);
        } else {
            share = 0;
        }
        return `${share}%`;
    }

}
