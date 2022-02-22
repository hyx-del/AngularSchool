import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
@Component({
    selector: 'app-classroom',
    templateUrl: './classroom.component.html',
    styleUrls: ['./classroom.component.scss']
})
export class ClassroomComponent implements OnInit {
    collection: any = {};
    addClassRoomShow: boolean = false;
    params: any = {
        max_number: 1,
    };
    form: nyForm;
    public buttons = [
        { name: 'create', click: () => this.addData() }
    ]
    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) { }

    ngOnInit() {

    }
    onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
    }
    public setCollection(collection) {
        this.collection = collection;
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.edit(item);
        }
    }
    // 添加教室--保存
    public handleOk() {
        if (this.params.id) {
            this.form.action = "school/teaching-school/classroom/update";
        } else {
            this.form.action = "school/teaching-school/classroom/create";
        }
        this.form.submit().then(() => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.params = {};
            this.handleCancel();
            this.collection.load();
        })
    }
    // 取消
    handleCancel() {
        this.form.body = {};
        this.form.clearError();
        this.addClassRoomShow = false;
    }
    //编辑
    edit(item) {
        this.http.get('school/teaching-school/classroom/detail', {id: item.id}).then(res => {
            this.params = this.form.body = res;
            this.addClassRoomShow = true;
        })
    }
    // 启用
    enable(item) {
        this.modalService.confirm({
            nzTitle: "确定启用这个教室",
            nzOnOk: () => {
                this.http.post("school/teaching-school/classroom/enable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }
    // 禁用
    disabled(item) {
        this.modalService.confirm({
            nzTitle: "确定禁用这个教室",
            nzOnOk: () => {
                this.http.post("school/teaching-school/classroom/disable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }
    //删除
    remove(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个教室",
            nzOnOk: () => {
                this.http.post("school/teaching-school/classroom/delete", { id: item.id, is_used: item.is_used }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }
    addData() {
        this.restoreDefaultData();
        this.addClassRoomShow = true;
    }
    restoreDefaultData() {
        this.params = {
            max_number: 1
        }
        this.form.body = { ...this.params };
        this.form.clearError();
    }
}
