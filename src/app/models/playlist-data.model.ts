export class PlaylistData {

    constructor(
        public _id?: string,
        public playlistName?: string,
        public playlistOrder?: number,
        public mastered?: number,
        public total?: number,
        public totalMastPract?: number,
        public totalUnmastPract?: number,
        public oldest?: string,
        public midDate?: string,
        public newest?: string
    ) {}
}