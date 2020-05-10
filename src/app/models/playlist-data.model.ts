export class PlaylistData {

    _id: string;
    playlistName: string;
    playlistOrder: number;
    inactive: number;
    mastered: number;
    everPracticed: number;
    total: number;
    midPoint: number;
    totalMastPract: number;
    totalUnmastPract: number;
    oldest: string;
    midDate: string;
    newest: string;
    editOrder: boolean;
    isPlaylistActive?: boolean;

    constructor(){
        this.editOrder = false;
    }

}