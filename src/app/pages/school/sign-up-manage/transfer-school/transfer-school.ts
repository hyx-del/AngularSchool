import { Component, OnInit } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
@Component({
    selector: 'app-transfer-school',
    templateUrl: './transfer-school.html',
    styleUrls: ['./transfer-school.scss']
})
export class TransferSchoolComponent implements OnInit {
    public collection:any = {};

    public isVisible = false;

    public salesmanList = [];

    public salesmanIds = [];

    public transferSchoolId = null;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private nzModalService: NzModalService
    ) {
     }

    ngOnInit() {
        this.getSalesmanList();
    }

    public setCollection(collection) {
        this.collection = collection
    }

    public getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            this.salesmanList = ret || [];
        });
    }

    public pass(item) {
       this.isVisible = true;
       this.transferSchoolId = item.id;
    }

    public subaSuditModal() {
        let parmas: any = {
            id: this.transferSchoolId,
        };

        parmas.salesman_id = this.salesmanIds || [];

        this.http.post('school/teaching-school/transfer-school/pass', parmas).then(res => {
            this.notification.success('提示信息', '审核成功!');
            this.cancelASuditModal();
            this.collection.load();
        })
    }

    public cancelASuditModal() {
        this.isVisible = false;
        this.salesmanIds = [];
    }

    public noPass(item) {
        this.nzModalService.confirm({
            nzTitle: '确认不通过申请?',
            nzOnOk: async () => {
                try {
                    await this.http.post('school/teaching-school/transfer-school/no-pass', { id: item.id });
                    this.notification.success('提示信息', '操作成功!');
                    this.collection.load();
                } catch (error) {
                    console.log(error);
                }
            }
        })
    }
}
