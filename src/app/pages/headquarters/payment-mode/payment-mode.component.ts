import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';

@Component({
    selector: 'app-payment-mode',
    templateUrl: './payment-mode.component.html',
    styleUrls: ['./payment-mode.component.scss']
})
export class PaymentModeComponent implements OnInit {
    public buttons = [
        { name: 'create', click: () => this.showModal() }
    ];
    collection: any = {};
    isVisible: boolean = false;
    params: any = {};

    form: nyForm;

    constructor(
        private http: Http,
        private notificationService: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.edit(item);
        }
    }

    onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
        }
    }

    showModal() {
        this.params = {};
        this.isVisible = true;
    }


    edit(data: any) {
        this.params = Object.assign({}, data)
        this.form.body = Object.assign({}, data);
        this.isVisible = true;
    }

    save() {
        if (this.params.id) {
            this.form.action = "school/teaching/payment-mode/update";
        } else {
            this.form.action = "school/teaching/payment-mode/create";
        }
        this.form.submit().then(() => {
            if (this.params.id) {
                this.notificationService.success("提示信息", "修改成功");
            } else {
                this.notificationService.success("提示信息", "创建成功");
            }
            this.collection.load();
            this.closeModal();
        })
    }

    closeModal() {
        this.isVisible = false;
        this.form.body = {};
        this.form.clearError();
    }

    changeStatus(data: any) {
        this.modalService.confirm({
            nzTitle: `确定${data.status == 1 ? '禁用' : '启用'}该支付方式？`,
            nzOnOk: () => {
                const url = data.status == 1 ? 'school/teaching/payment-mode/disable' : 'school/teaching/payment-mode/enable';

                this.http.post(url, { id: data.id }).then(ret => {
                    this.notificationService.success("提示信息", `${data.status == 1 ? '禁用' : '启用'}成功`);
                    this.collection.load();
                })
            }
        })
    }

    remove(data) {
        this.modalService.confirm({
            nzTitle: `确定删除支付方式"${data.name}"？`,
            nzOnOk: () => {
                this.http.post('school/teaching/payment-mode/delete', { id: data.id }).then(ret => {
                    this.notificationService.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
        
    }
}
