import { Component, OnInit } from '@angular/core';
import { VocabRepository } from 'src/app/models/vocab.repository';
import { Noun } from '../../models/noun.model';
import { AudioService } from 'src/app/services/audio.service';
import { faPlay } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-view',
    templateUrl: './view.component.html',
    styleUrls: ['./view.component.scss']
})
export class ViewComponent implements OnInit {

    selected: Noun[];
    faPlay = faPlay;
    tagName: string;

    constructor(
        private vocabRepository: VocabRepository,
        private audioService: AudioService
    ) {
        this.selected = [];
    }

    ngOnInit() {
    }

    get nouns(): Noun[] {
        return this.vocabRepository.getNouns();
    }

    playFile(filePath: string) {
        this.audioService.playSingle(filePath);
    }


    printTags(noun: Noun): string {
        if (noun.tags && noun.tags.length) {
            return noun.tags.join(' ');
        } else {
            return '';
        }
    }

    toggleSelected(nounId: string) {
        let selectedIndex = this.selected.findIndex( n => n._id === nounId);
        if (selectedIndex == -1) {
            let noun = this.vocabRepository.getSingleNoun(nounId);
            this.selected.push(noun);
        } else {
            this.selected.splice(selectedIndex, 1);
        }
        // this.logSelected();
    }

    logSelected() {
        console.log('NOUNS CURRENTLY SELECTED');
        this.selected.forEach( n => {
            console.log(n.eng_text);
        })
    }

    getSelectedIds(): string[] {
        return this.selected.map(n => n._id);
    }

    addTag() {
        this.vocabRepository.saveTags(this.tagName, this.getSelectedIds());
    }

}
