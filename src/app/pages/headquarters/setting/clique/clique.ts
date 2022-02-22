import { Component, OnInit, ViewChild, } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { TemplateComponent } from "../template/template.component";

@Component({
    selector: 'app-clique',
    templateUrl: './clique.html',
    styleUrls: ['./clique.scss']
})
export class CliqueComponent implements OnInit {
    public collection: any = {};

    public buttons = [
        { name: 'create', click: () => this.addClique() }
    ];

    @ViewChild("template") template: TemplateComponent;

    public addCliqueModalVisible = false;

    public template_name;

    public params: any = {};

    public form: nyForm;

    constructor(
        private http: Http,
        private modalService: NzModalService,
        private notificationService: NzNotificationService,
    ) {
    }

    ngOnInit() {

    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.detail(item)
        }

    }

    public async detail(item) {        
        const result = await this.http.post('school/teaching/clique/detail', { id: item.id });
        this.addCliqueModalVisible = true;
        this.params = this.form.body = result;        
    }

    public addClique() {
        this.addCliqueModalVisible = true;
    }

    public handleCancel() {
        this.addCliqueModalVisible = false;
        this.form.body = {};
        this.params = {};
        this.form.clearError();
    }

    public handleOk() {
        if (this.params.id) {
            this.form.action = 'school/teaching/clique/update'
        } else {
            this.form.action = 'school/teaching/clique/create';
        }
        this.form.submit().then(res => {
            this.notificationService.success('提示信息', `${this.params.id ? '修改' : '添加' }成功`);
            this.collection.load();
            this.handleCancel();
        })
    }

    public onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = body => {
            if (this.params.id) {
                body.id = this.params.id
            }
        }
    }

    public startUp(item) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要启用该派别？',
            nzOnOk: () => {
                this.http.post('school/teaching/clique/enable', { id: item.id }).then(res => {
                    this.notificationService.success('提示信息', '启用成功!');
                    this.collection.load();
                })

            }
        })
     }

    public forbidden(item) { 
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要禁用该派别？',
            nzOnOk: () => {
                this.http.post('school/teaching/clique/disable', { id: item.id }).then(res => {
                    this.notificationService.success('提示信息', '禁用成功!');
                    this.collection.load();
                })

            }
        })
     }

    public remove(item) { 
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要删除该条数据？',
            nzOnOk: () => {
                this.http.post('school/teaching/clique/delete', { id: item.id }).then(res => {
                    this.notificationService.success('提示信息', '删除成功!');
                    this.collection.load();
                })

            }
        })
    }
}
