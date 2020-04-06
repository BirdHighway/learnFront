import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VocabRepository } from 'src/app/models/vocab.repository';
import { Noun } from 'src/app/models/noun.model';

@Component({
    selector: 'app-edit',
    templateUrl: './edit.component.html',
    styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {

    _id: string;
    noun: Noun;
    tags: string;

    constructor(private route: ActivatedRoute,
        private vocabRepository: VocabRepository,
        private router: Router) {
            this.noun = new Noun();
            this.tags = '';
        }

    ngOnInit() {
        this._id = this.route.snapshot.paramMap.get('id');
        this.vocabRepository.getNounObservable(this._id)
            .subscribe( (n) => {
                console.log(n);
                this.noun = n;
                if (n.tags) {
                    this.tags = n.tags.join(', ');
                } else {
                    this.tags = '';
                }
            })
    }

    saveNoun() {
        this.noun.tags = this.tags.split(',');
        this.vocabRepository.updateNoun(this.noun)
            .subscribe( (n) => {
                console.log('subscribe function on saveNoun()');
                console.log(n);
                this.router.navigate(['/','view'])
                    .then(nav => {
                        console.log(nav);
                        window.location.reload();
                    }, err => {
                        console.error(err);
                    });


            })
    }

}
