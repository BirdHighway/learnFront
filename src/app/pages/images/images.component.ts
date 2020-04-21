import { Component, OnInit } from '@angular/core';
import { Environment } from 'src/app/environment';

@Component({
    selector: 'app-images',
    templateUrl: './images.component.html',
    styleUrls: ['./images.component.scss']
})

export class ImagesComponent implements OnInit {

    imageFiles: string[];
    narrowImageFiles: string[];
    chartFiles: string[];

    displayType: string;
    base: string;

    constructor() {
        this.displayType = 'images';
        this.base = `${Environment.PROTOCOL}://${Environment.HOST}:${Environment.PORT}/images/`;
        this.imageFiles = [
            'arabic-map.jpg',
            'wiki-dialects-map.png',
            'mid-east-political.jpg',
            'muslim-pop-cartogram.jpg',
            'world-pop-cartogram.png'
        ];
        this.narrowImageFiles = [
            'mid-east-sat.jpg',
            'dialects-sample-map.jpg',
            'israel-map.jpg',
            'syria-map.jpg'
        ];
        this.chartFiles = [
            'levant-religion.png',
            'mid-east-religion.jpg',
            'mid-east-ethnic.png',
            'world-gdp-cartogram.png',
            'world-gdp-pp.png',
            'world-pop-cartogram.png',
            'muslim-pop-cartogram.jpg',
            'syria-profile.jpg'
        ];
    }

    ngOnInit() {
    }

    showImages() {
        this.displayType = 'images';
    }

    showNarrows() {
        this.displayType = 'narrows';
    }

    showCharts() {
        this.displayType = 'charts';
    }

}
