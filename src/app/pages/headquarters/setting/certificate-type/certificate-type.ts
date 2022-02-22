import { Component, OnInit, ViewChild, } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { TemplateComponent } from "../template/template.component";

@Component({
    selector: 'app-certificate-type',
    templateUrl: './certificate-type.html',
    styleUrls: ['./certificate-type.scss']
})
export class CertificateType implements OnInit {
    public collection: any = {};

    public buttons = [
        { name: 'create', click: () => this.addCertificate() }
    ];

    @ViewChild("template") template: TemplateComponent;

    public certificateModalVisible = false;

    public template_name;

    public params: any = {};

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

    public addCertificate() {
        this.certificateModalVisible = true;
    }

    public save() {
        this.template.cancelLinellae(); // 取消辅助线条

        let newHtml = document.querySelector('#svg');
        let doc = new XMLSerializer().serializeToString(newHtml);
        let params: any = {
            name: this.template_name,
            picture: this.template.picture,
            template: doc,
		}
		
        if (!this.template_name) {
            this.notificationService.info('提示信息', '请输入模板名称!');
            return;
        }

        if (!this.template.picture) {
            this.notificationService.info('提示信息', '请上传一张模板图!');
            return;
        }

        if (this.params.id) {
            params.id = this.params.id
            this.http.post('school/teaching/certificate-template/update', params).then(res => {
                this.collection.load();
                this.cancelCertificateModal();
                this.notificationService.success('提示信息', '修改成功!');
            })
            return;
        }

        this.http.post('school/teaching/certificate-template/create', params).then(res => {
            this.cancelCertificateModal();
            this.collection.load();
            this.notificationService.success('提示信息', '添加成功!');
        })
    }

    public cancelCertificateModal() {
        this.certificateModalVisible = false;
        this.template_name = null;
        this.params = {};
        this.template.clear();
    }

    public detail(item) {
        this.http.get('school/teaching/certificate-template/detail', { id: item.id }).then(res => {
            this.params = Object.assign({}, res);
            this.template.detailSvgDom();
            this.template_name = res.name;
            this.certificateModalVisible = true;
        })
    }

    public startUp(item) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要启用？',
            nzOnOk: () => {
                this.http.post('school/teaching/certificate-template/enable', { id: item.id }).then(res => {
                    this.collection.load();
                })

            }
        })
    }

    public forbidden(item) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要禁用？',
            nzOnOk: () => {
                this.http.post('school/teaching/certificate-template/disable', { id: item.id }).then(res => {
                    this.collection.load();
                })

            }
        })
    }

    public remove(item) {
        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要删除？',
            nzOnOk: () => {
                this.http.post('school/teaching/certificate-template/delete', { id: item.id }).then(res => {
                    this.collection.load();
                })

            }
        })
    }
}
