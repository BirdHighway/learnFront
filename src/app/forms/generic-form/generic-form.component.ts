import { Component, OnInit } from '@angular/core';
import { FormGroup, FormArray, FormControl } from '@angular/forms';
import { Noun } from 'src/app/models/noun.model';
import { VocabRepository } from 'src/app/models/vocab.repository';

@Component({
    selector: 'app-generic-form',
    templateUrl: './generic-form.component.html',
    styleUrls: ['./generic-form.component.scss']
})
export class GenericFormComponent implements OnInit {

    entriesModel = new FormGroup({
        entriesArray: new FormArray([])
    });

    constructor(private vocabRepository: VocabRepository) {
    }

    ngOnInit() {
    }

    entriesArray = this.entriesModel.get("entriesArray") as FormArray;

    addLine() {
        const group = new FormGroup({
            prompt_text: new FormControl(''),
            prompt_audio: new FormControl(''),
            response_text: new FormControl(''),
            response_audio: new FormControl(''),
            source: new FormControl(''),
            tags: new FormControl('')
        });
        this.entriesArray.push(group);
    }

    saveEntries() {
        console.log('saveEntries()');
        this.vocabRepository.saveGenericEntries(this.entriesModel.value);
    }

    removeLine(index) {
        this.entriesArray.removeAt(index);
    }

}
