import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

// 资源类型管理
@Component({
    selector: 'app-resource',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss']
})
export class ResourceComponent implements OnInit {
    public buttons = [
        { name: 'create', click: () => this.showModal() }
    ];

    collection: any = {};
    isVisible: boolean = false;
    params: any = {};

    constructor(
        private http: Http,
        private notification: NzNotificationService,
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

    showModal() {
        this.isVisible = true;
    }

    edit(data: any = {}) {
        this.params = Object.assign({}, data);
        this.isVisible = true;
    }

    create() {
        let params = Object.assign({}, this.params);
        if (params.id) {
            this.http.post("school/teaching/resource/update", params).then(ret => {
                this.notification.success("提示信息", "修改成功");
                this.collection.load();
                this.closeModal();
            });
        } else {
            this.http.post("school/teaching/resource/create", params).then(ret => {
                this.notification.success("提示信息", "创建成功");
                this.collection.load();
                this.closeModal();
            });
        }
    }

    remove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定删除？",
            nzOnOk: () => {
                this.http.post("school/teaching/resource/delete", { id: data.id }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    changeStatus(data: any) {
        if (data.status == 1) {
            this.http.post("school/teaching/resource/disable", { id: data.id }).then(ret => {
                this.notification.success("提示信息", "禁用成功");
                this.collection.load();
            });
        } else {
            this.http.post("school/teaching/resource/enable", { id: data.id }).then(ret => {
                this.notification.success("提示信息", "启用成功");
                this.collection.load();
            });
        }
    }

    closeModal() {
        this.isVisible = false;
        this.params = {};
    }
}
