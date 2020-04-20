import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

    fullForm = new FormGroup({
        n1: new FormControl(''),
        n2: new FormControl(''),
        n3: new FormControl(''),
        n4: new FormControl(''),
        n5: new FormControl(''),
        n6: new FormControl(''),
        n7: new FormControl(''),
        n8: new FormControl(''),
    })

    constructor() { }

    ngOnInit() {
    }

    saveText() {
        let a = [];
        let names = ['n1','n2','n3','n4','n5','n6','n7','n8'];
        for (let i=0; i<names.length; i++) {
            a.push(this.fullForm.value[names[i]]);
        }
        console.log(a);
    }

}
