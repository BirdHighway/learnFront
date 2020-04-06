export class GenericPrompt {

    constructor(
        public _id?: string,
        public prompt_text?: string,
        public prompt_audio?: string,
        public response_text?: string,
        public response_audio?: string,
        public source?: string,
        public tags?: string[]
    ) {}
}