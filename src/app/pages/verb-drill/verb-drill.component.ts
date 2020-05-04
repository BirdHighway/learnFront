import { Component, OnInit } from '@angular/core';
import { RestDataSource } from 'src/app/models/rest.datasource';
import { AudioPlayerService } from 'src/app/services/audioPlayer';
import { VerbSet } from 'src/app/models/verb-sets/verb-set.model';

@Component({
    selector: 'app-verb-drill',
    templateUrl: './verb-drill.component.html',
    styleUrls: ['./verb-drill.component.scss']
})
export class VerbDrillComponent implements OnInit {

    showOptions: boolean;
    showMain: boolean;
    verbs: VerbSet[];
    drillType: string;
    drillMaterial: string;
    counter: number;

    // subs
    verbSub;

    constructor(
        private dataSource: RestDataSource,
        private audioPlayer: AudioPlayerService
    ) {
        this.showOptions = true;
        this.showMain = false;
        this.drillType = 'identification';
        this.drillMaterial = 'study-verbs';
        this.counter = 0;
        this.verbs = [];
    }

    ngOnInit() {
    }

    beginDrill() {
        this.loadVerbs();
    }

    loadVerbs() {
        let queryString = '';
        if (this.drillMaterial === 'study-verbs') {
            // verbs with status of "study"
            queryString = `collectionType=by-status&status=study`;
        } else if (this.drillMaterial === 'entire-set') {
            // all verbs in DB
            queryString = `collectionType=entire-set`;
        } else if (this.drillMaterial === 'ready-verbs') {
            // verbs with status neither "new" nor "hidden"
            queryString = `collectionType=ready`;
        }
        this.verbSub = this.dataSource.getVerbCollection(queryString)
            .subscribe(response => {
                if (response.status === 'success') {
                    response.data.forEach(verbData => {
                        let v = new VerbSet();
                        Object.assign(v, verbData);
                        this.verbs.push(v);
                    });
                    this.showMain = true;
                    this.showOptions = false;
                } else {
                    console.error(response.data);
                }
            })
    }

}
