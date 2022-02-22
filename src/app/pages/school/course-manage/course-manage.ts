import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-course-manage',
    templateUrl: './course-manage.html',
    styleUrls: ['./course-manage.scss']
})
export class CourseManage implements OnInit {
    public collection: any = {};

    constructor() {
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
    }

}
