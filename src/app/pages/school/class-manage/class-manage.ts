import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { NzNotificationService, NzModalService } from "ng-zorro-antd";
import { ClassService } from '@/providers/index'

@Component({
    selector: 'app-class-manage',
    templateUrl: './class-manage.html',
    styleUrls: ['./class-manage.scss']
})
export class ClassManage implements OnInit {
    public collection: any = {};

    public buttons = [
        { name: 'create', click: () => this.addClass() }
    ];

    public addClassVisible = false;

    public addClassForm: nyForm;

    public SemesterList = [];

    public params: any = {};

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
        private classService: ClassService,
    ) {
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.classDetail(item)
        }
    }

    public addClass() {
        this.getSemesterList();
        this.addClassVisible = true;
    }

    public addClassModelCancel() {
        this.addClassVisible = false;
        this.addClassForm.clearError();
        this.addClassForm.body = {};
        this.params = {};
    }

    public addClassModelOK() {
        if (this.params.id) {
            this.addClassForm.action = 'school/teaching-school/class/update';
        } else {
            this.addClassForm.action = 'school/teaching-school/class/create';
        }
        this.addClassForm.submit().then(res => {
            this.notificationService.success('提示信息', `${this.params.id ? '班级修改' : '班级创建'}成功!`);
            this.addClassModelCancel();
            this.collection.load();
            this.classService.refresh();
        })
    }

    public subAddClassForm() {
        this.addClassForm.request = this.http.request.bind(this.http);
        this.addClassForm.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
        }
    }

    public getSemesterList() {
        let params: any = {
            date: true,
            status: 1,
        }
        if (this.params.id) {
            params = {}
        }
        this.http.get('school/teaching-school/school/get-semester-list', params).then(res => {
            this.SemesterList = res;
        })
    }

    public async classDetail(item) {
        const data = await this.http.get('school/teaching-school/class/detail', { id: item.id });
        this.addClassForm.body = data;
        this.params = data;
        this.getSemesterList();
        this.addClassVisible = true;
    }

    public startUp(item: any) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定启用该班级？',
            nzOnOk: async () => {
                await this.http.post('school/teaching-school/class/enable', { id: item.id });
                this.notificationService.success('提示信息', '启用成功!');
                this.classService.refresh();
                this.collection.load();
            }
        })
    }

    public forbidden(item: any) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定禁用该班级？',
            nzOnOk: async () => {
                await this.http.post('school/teaching-school/class/disable', { id: item.id });
                this.notificationService.success('提示信息', '禁用成功!');
                this.classService.refresh();
                this.collection.load();
            }
        })
    }

    public remove(item: any) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定删除该班级？',
            nzOnOk: async () => {
                await this.http.post('school/teaching-school/class/delete', { id: item.id, is_used: item.is_used });
                this.notificationService.success('提示信息', '删除成功!');
                this.classService.refresh();
                this.collection.load();
            }
        })
    }

}
