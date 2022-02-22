import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { Collection } from "@yilu-tech/ny/search";
import { FileService } from "@/providers/file-service";
import { Config } from '@/config';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';

@Component({
    selector: 'app-semester-template',
    templateUrl: './semester-template.html',
    styleUrls: ['./semester-template.scss']
})
export class SemesterTemplateComponent implements OnInit {

    public buttons: Array<object> = [
        { name: 'create', click: () => this.addTemplate() }
    ];

    public collection: Collection = new Collection(this.http);

    public addModalVisible: boolean = false;

    public form: nyForm;

    public params: any = {
        register_mode: 20,
        is_contain_quarterage: 1,
    };

    public introduction: string;

    public ossPath: string;

    constructor(
        private http: Http,
        private fileService: FileService,
        private modalService: NzModalService,
        private notification: NzNotificationService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = item => this.details(item)
        }
    }

    public remove(item) {
        this.modalService.confirm({
            nzTitle: '确认删除该学期模板吗?',
            nzOnOk: () => {
                this.http.post('school/teaching/semester-template/delete', { id: item.id }).then(res => {
                    this.notification.success('提示信息', '删除成功!');
                    this.collection.load();
                })
            }
        })
    }

    private addTemplate() {
        this.addModalVisible = true;
    }

    public close() {
        this.addModalVisible = false;
        this.form.clearError();
        this.form.body = {};
        this.introduction = '';
        this.params = {
            register_mode: 20,
            is_contain_quarterage: 1,
        }
    }

    public saveForm() {
        if (!this.params.picture) {
            this.notification.info('提示信息', '请上传图片!');
            return;
        }

        if (!this.introduction) {
            this.notification.info('提示信息', '请输入学期介绍!');
            return;
        }

        if (this.params.id) {
            this.form.action = 'school/teaching/semester-template/update';
        } else {
            this.form.action = 'school/teaching/semester-template/create';
        }
        this.form.submit().then(res => {
            this.notification.success('提示信息', `${this.params.id ? '修改' : '创建' }成功!`);
            this.collection.load();
            this.close();
        })
    }

    public initForm() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = body => {
            body.picture = this.params.picture;
            body.introduction = this.introduction;
            body.register_mode = this.params.register_mode;
            body.is_contain_quarterage = this.params.is_contain_quarterage ? 1 : 0;
            this.params.id ? body.id = this.params.id : '';
            
            if (this.params.picture) {
                body.picture = this.params.picture;
            }
            if (this.params.poster_picture) {
                body.poster_picture = this.params.poster_picture;
            }
            if (this.params.wx_picture) {
                body.wx_picture = this.params.wx_picture;
            }
        }
    }

    public uploadImgComplete(data: any, type: number = 1) {
        if (type == 1) {
            this.params.picture = data.path;
        } else if (type == 2) {
            this.params.poster_picture = data.path;
        } else if (type == 3) {
            this.params.wx_picture = data.path;
        }
    }

    public async details(data) {
        const result = await this.http.get('school/teaching/semester-template/detail', { id: data.id });
        this.form.body = Object.assign({}, result);
        this.params = Object.assign({}, result);
        this.introduction = result.introduction;
        this.addModalVisible = true;
    }

}
