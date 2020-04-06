export class Noun {
    constructor(
        public _id?: string,
        public eng_text?: string,
        public eng_audio?: string,
        public a_sing_text?: string,
        public a_sing_audio?: string,
        public a_pl_text?: string,
        public a_pl_audio?: string,
        public source?: string,
        public tags?: string[]
    ) { }
}