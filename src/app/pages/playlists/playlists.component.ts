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

    playlistsRaw = [];
    playlistBasics = {};
    playlistDataSets: PlaylistData[] = [];
    dataReady: boolean = false;
    dataSetsReady: boolean = false;
    showCreate: boolean = false;
    savingPlaylist: boolean = false;
    focusPlaylistOrder: number;
    isEditMode: boolean;
    isSaving: boolean;

    globalMast: number;
    globalUnmast: number;
    globalInactive: number;
    globalTotal: number;
    globalUnmastPracticed: number;
    
    globalMastP: number;
    globalUnmastP: number;
    globalInactiveP: number;
    globalUnmastPracticedP: number;

    constructor(private dataSource: RestDataSource) { }

    ngOnInit() {
        this.loadPlaylists();
        this.initialize();
    }

    initialize() {
        this.focusPlaylistOrder = 0;
        this.isEditMode = false;
        this.isSaving = false;
        this.playlistsRaw = [];
        this.playlistDataSets = [];
        this.globalMast = 0;
        this.globalUnmast = 0;
        this.globalInactive = 0;
        this.globalTotal = 0;
        this.globalUnmastPracticed = 0;
    }

    loadPlaylists() {
        this.dataReady = false;
        this.dataSource.getFullPlaylistData()
            .subscribe(response => {
                if (response.status === 'success') {
                    let basicInfo = response.data[1];
                    basicInfo.forEach(p => {
                        this.playlistBasics[p._id] = p;
                    })
                    this.playlistsRaw = response.data[0];
                    this.playlistsRaw.forEach(p => {
                        let np = new PlaylistData();
                        Object.assign(np, p);
                        if (this.playlistBasics[np._id]) {
                            np.isPlaylistActive = this.playlistBasics[np._id].isActive;
                        } else {
                            np.isPlaylistActive = false;
                            np.playlistName = 'Unassigned';
                            np.playlistOrder = 1000;
                        }
                        this.playlistDataSets.push(np);
                    })
                    this.generateGlobalStats();
                    
                    console.log(this.playlistDataSets);
                    this.dataSetsReady = true;
                } else {
                    console.error(response.data);
                }
            })
    }

    generateGlobalStats() {
        this.playlistDataSets.forEach(p => {
            if (p._id != '5e90354e7a025702a3538319') {
                this.globalTotal += p.total;
                this.globalMast += p.mastered;
                this.globalInactive += p.inactive;
                this.globalUnmastPracticed += p.totalUnmastPract;
            }
        })
        this.globalUnmast = this.globalTotal - (this.globalInactive + this.globalMast);
        this.globalMastP = this.doPercent(this.globalMast, this.globalTotal);
        this.globalInactiveP = this.doPercent(this.globalInactive, this.globalTotal);
        this.globalUnmastPracticedP = this.doPercent(this.globalUnmastPracticed, this.globalTotal);
        this.globalUnmastP = 100 - (this.globalMastP + this.globalInactiveP);
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
            return 500 - mastPercent;
        }
    }

    doPercent(part: number, whole: number): number {
        if ((part == 0) || (whole == 0)) {
            return 0;
        }
        return Math.floor((part / whole) * 100);
    }

    globalProgress(field: string): number {
        let maxPossible = this.globalTotal;
        let mastered = this.globalMast;
        let inactive = this.globalInactive;
        let unmastered = this.globalUnmast;
        if (field === 'mastered') {
            return this.doPercent(mastered, maxPossible);
        } else if (field === 'unmastered') {
            return this.doPercent(unmastered, maxPossible);
        } else if (field === 'inactive') {
            return this.doPercent(inactive, maxPossible);
        }
        return 0;
    }

    absoluteProgress(playlistData: PlaylistData, field: string): number {
        let maxPossible = 50;
        let mastered = playlistData.mastered;
        let inactive = playlistData.inactive;
        let unmastered = playlistData.total - (playlistData.mastered + playlistData.inactive);
        if (field === 'mastered') {
            return this.doPercent(mastered, maxPossible);
        } else if (field === 'unmastered') {
            return this.doPercent(unmastered, maxPossible);
        } else if (field === 'inactive') {
            return this.doPercent(inactive, maxPossible);
        }
        return 0;
    }

    playlistClasses(playlistData: PlaylistData) {
        let classes = {
            'card': true,
            'border-dark': true,
            'playlist-card': true,
            'shadow': true    
        }
        if ((playlistData.playlistOrder % 10) == 0) {
            classes['begins-playlist-group'] = true;
        }
        if (!playlistData.isPlaylistActive) {
            classes['inactive-playlist'] = true;
            return classes;
        }
        if (playlistData._id == '5e90354e7a025702a3538319') {
            classes['hidden-playlist'] = true;
            return classes;
        }

        let mast = playlistData.mastered;
        let inactive = playlistData.inactive;
        let total = playlistData.total;
        let unmast = total - (mast + inactive);
        let unmastPracticed = playlistData.totalUnmastPract;
        if (total < 1) {
            return classes;
        }
        let shareMast = mast / total;
        let sharePract = 0;
        if (unmast > 0) {
            sharePract = unmastPracticed / unmast;
        }
        if (shareMast > .8) {
            classes['progress-great'] = true;
        } else if ((shareMast > .5) && (sharePract > .9)) {
            classes['progress-good'] = true;
        } else if (sharePract > .9) {
            classes['progress-fair'] = true;
        } else {
            classes['progress-low'] = true;
        }
        return classes;
    }

    getSizeInteger(playlistData: PlaylistData): number {
        if (playlistData.total == 0) {
            return 0;
        }
        return Math.floor((playlistData.total / 50) * 100);
    }

    editOrder(playlist: PlaylistData) {
        if (this.isEditMode) { return; }
        this.isEditMode = true;
        playlist.editOrder = true;
        this.focusPlaylistOrder = playlist.playlistOrder;
    }

    saveNewOrder(playlist: PlaylistData) {
        this.isSaving = true;
        this.dataSource.updatePlaylistOrder(playlist._id, this.focusPlaylistOrder)
            .subscribe(result => {
                if (result.status != 'success') {
                    console.error(result.data);
                } else {
                    this.isSaving = false;
                    this.initialize();
                    this.loadPlaylists();
                }
            })
    }

    cancelNewOrder(playlist: PlaylistData) {
        this.isEditMode = false;
        playlist.editOrder = false;
        
    }

}
