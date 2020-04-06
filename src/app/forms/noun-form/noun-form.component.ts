import { Component, OnInit } from '@angular/core';
import { Noun } from 'src/app/models/noun.model';
import { VocabRepository } from 'src/app/models/vocab.repository';

@Component({
  selector: 'app-noun-form',
  templateUrl: './noun-form.component.html',
  styleUrls: ['./noun-form.component.scss']
})
export class NounFormComponent implements OnInit {

    newNoun = new Noun();

  constructor(private vocabRepository: VocabRepository) { }

  ngOnInit() {
  }

  submitForm(){
      this.vocabRepository.saveNoun(this.newNoun);
  }



}
