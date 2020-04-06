import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.scss']
})
export class NewComponent implements OnInit {

    vocabType: string;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
  }

}
