import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-report-card',
    templateUrl: './report-card.html',
    styleUrls: ['./report-card.scss']
})
export class ReportCard implements OnInit {
    public collection: any = {};

    constructor() {
    }

    ngOnInit() {
    }

    public setCollection(collection: any) {
        this.collection = collection;
    }

}
