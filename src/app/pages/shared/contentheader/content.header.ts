import { Component, OnInit, Input, DoCheck } from '@angular/core';

@Component({
    selector: 'content-header',
    templateUrl: './content.header.html',
    styleUrls: ['./content.header.scss']
})
export class contentHeader implements DoCheck {
    public buttonOptions: any = {};
    public isActive = -1;

    @Input() buttonGroups: any[];
    @Input() collection;
    @Input() dropdownType: boolean = false;
    @Input() pageSizeList: number[] = [20, 30, 50, 100];

    constructor() {}

    ngDoCheck() {
        this.buttonOptions = { newBtn: [], dropdownData: [] };
        if (this.buttonGroups) {
            this.buttonGroups.forEach((item: any) => {	
                if (this.toBool(item.hidden)) return;			
                if (item.name) {
					this.buttonOptions[item.name] = item;
                } else if (item.label) {
                    item.dropdownGroup ? this.buttonOptions.dropdownData.push(item) : this.buttonOptions.newBtn.push(item)
                }
            })
        }
    }

    public toBool(_: any) {
        return typeof _ === 'function' ? _() : !!_;
    }

    public buttonClick(item) {
        if (item.click) item.click()
    }

    public newButtonClick(item: any, index?: number) {
		const data = this.buttonOptions.newBtn.filter(item => item.hasOwnProperty('isActive'))
		
        data.forEach((item, i) => {
            item.isActive = false;
            if (i == index) {
                item.isActive = true;
            }
        })
        if (item.click) item.click()
    }

    public prevPage(end: boolean = false) {
        let prev = end ? 1 : this.collection.page - 1;
        if (prev >= 1) {
            this.collection.page = prev;
        }

    }

    public nextPage(end: boolean = false) {
        let next = end ? this.collection.pageTotal : this.collection.page + 1;
        if (next >= 1) {
            this.collection.page = next;
        }
    }

}
