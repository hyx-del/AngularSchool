import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService } from 'ng-zorro-antd';
import { Config } from '@/config';
import { FileService } from '@/providers/index';
import * as dayjs from 'dayjs'

@Component({
    selector: 'app-coach-manage',
    templateUrl: './coach-manage.html',
    styleUrls: ['./coach-manage.scss']
})
export class CoachManage implements OnInit {

    public ossPath: string = "";

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })

    }

    ngOnInit() {
    }

    public collection: any = {};

    public detailModelVisible = false;

    public detailForm: nyForm;

    public picture: any;

    public remark: any;

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.showDetail(item);
        }
    }

    public async showDetail(item) {
        const data = await this.http.get('school/teaching/coach/detail', { id: item.id })
        this.detailForm.body = data;
        this.remark = data.description;
        this.picture = data.avatar;
        this.detailModelVisible = true;
    }

    public cancelDetailModel() {
        this.detailModelVisible = false;
        this.detailForm.body = {};
    }

}
