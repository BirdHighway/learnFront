import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { Playlist } from 'src/app/models/playlist.model';

@Component({
    selector: 'app-playlist-edit',
    templateUrl: './playlist-edit.component.html',
    styleUrls: ['./playlist-edit.component.scss']
})
export class PlaylistEditComponent implements OnInit {

    playlistId: string;
    playlist: Playlist;
    playlistIsActive: string;
    dataLoaded: boolean;
    savePending: boolean;


    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataSource: RestDataSource
    ) {
        this.dataLoaded = false;
        this.savePending = false;
        this.playlistIsActive = '';
    }

    ngOnInit() {
        this.playlistId = this.route.snapshot.paramMap.get('id');
        this.dataSource.getOnePlaylist(this.playlistId)
            .subscribe(response => {
                if (response.status === 'success') {
                    this.playlist = response.data[0];
                    this.playlistIsActive = this.playlist.isActive ? 'true' : 'false';
                    this.dataLoaded = true;
                } else {
                    console.error(response);
                }
            })
    }

    saveChanges() {
        this.playlist.isActive = (this.playlistIsActive == 'true') ? true : false;
        console.log(this.playlist);
        this.dataSource.updatePlaylist(this.playlist)
            .subscribe(result => {
                if (result.status === 'success') {
                    console.log('success');
                    this.router.navigate(['/playlists']);
                } else {
                    console.error(result.data);
                }
            })
    }

}
