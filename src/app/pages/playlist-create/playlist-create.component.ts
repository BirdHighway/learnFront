import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Router } from '@angular/router';
import { Playlist } from 'src/app/models/playlist.model';

@Component({
    selector: 'app-playlist-create',
    templateUrl: './playlist-create.component.html',
    styleUrls: ['./playlist-create.component.scss']
})
export class PlaylistCreateComponent implements OnInit {

    newOrder: number;
    playlistName: string;
    dataReady: boolean;
    existingPlaylists: Playlist[];
    deleteConfirmation: boolean;
    deleteName: string;
    deleteId: string;

    constructor(
        private dataSource: RestDataSource,
        private router: Router
    ) {
        this.newOrder = 999;
        this.playlistName = '';
        this.dataReady = false;
        this.deleteConfirmation = false;
        this.deleteName = '';
        this.deleteId = '';
    }

    ngOnInit() {
        this.dataSource.getPlaylists()
            .subscribe(data => {
                if (data.status === 'success') {
                    this.existingPlaylists = data.data;
                    this.existingPlaylists.sort((a, b) => {
                        if (a.name < b.name) {
                            return -1;
                        } else {
                            return 1;
                        }
                    })
                    let orderNums = data.data.map(p => {
                        return p.order;
                    })
                    this.newOrder = Math.max(...orderNums) + 1;
                    this.dataReady = true;
                } else {
                    console.error(data.data);
                }
            })
    }

    submitPlaylist() {
        this.dataSource.createPlaylist(this.playlistName, this.newOrder)
            .subscribe(result => {
                if (result.status === 'success') {
                    this.router.navigate(['/playlists']);
                } else {
                    console.error(result.data);
                }
            })
    }


    startDelete(playlist: Playlist) {
        this.deleteConfirmation = true;
        this.deleteName = playlist.name;
        this.deleteId = playlist._id;
    }

    cancelDelete() {
        this.deleteConfirmation = false;
        this.deleteName = '';
        this.deleteId = '';
    }

    confirmDelete() {
        this.dataSource.deletePlaylist(this.deleteId)
            .subscribe(result => {
                if (result.status != 'success') {
                    console.error(result.data);
                } else {
                    // success
                    let index = this.existingPlaylists.findIndex(p => p._id === this.deleteId);
                    if (index != -1) {
                        this.existingPlaylists.splice(index, 1);
                        this.deleteConfirmation = false;
                        this.deleteName = '';
                        this.deleteId = '';
                    } else {
                        console.error('index of deleted playlist not found');
                    }
                }
            })
    }

}
