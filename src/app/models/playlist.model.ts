export class Playlist {
    constructor(
        public _id?: string,
        public name?: string,
        public tags?: string[],
        public created?: string,
        public count?: number,
        public mastered?: number,
        public order?: number
    ) { }
}