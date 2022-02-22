import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { NzNotificationService } from 'ng-zorro-antd';
import { Config } from '@/config';
import { FileService, ClassService } from '@/providers/index';

@Component({
    selector: 'app-school',
    templateUrl: './school.component.html',
    styleUrls: ['./school.component.scss']
})
export class SchoolComponent implements OnInit {
    public collection: any = {};

    public isVisible = false;//添加

    public form: nyForm;

    public loading: boolean = false;

    public UploadLoading = false;

    public params: any = {
        pictures: [],
    };

    public ossPath = '';

    public provinceList: any = [];

    public cityList: any = [];

    public buttons: any[] = [
        { name: 'create', click: () => this.showModal() },
    ];

    public isInit = true;

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private fileService: FileService,
        private classService: ClassService
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getList();
    }

    setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('name').click = (item) => this.showModal(item);
        }
    }

    public async showModal(item?) {// 详情
        if (item) {
            this.getList();
            try {
                const result = await this.http.get('school/teaching/school/detail', { id: item.id });
                this.isInit = true;
                this.form.body = result;
                this.params = result;
                this.params.province_id = parseInt(result.province_id);
                this.params.city_id = parseInt(result.city_id);
                this.getList(this.params.province_id, 'province');
                this.isVisible = true;
            } catch (e) {
                console.log(e)
            }
            return;
        }
        this.isVisible = true;
    }

    // 获取省市
    public getList(id?: number, type?: string) {
        let params: any = {};
        if (id) {
            params.id = id;
        }
        this.http.post('school/teaching/school/address-select', params).then(res => {
            switch (type) {
                case 'province':
                    this.cityList = res;
                    this.params.city_id = res[0].id;
                    // this.getList(this.params.city_id, 'city');
                    break;
                // case 'city':
                //     this.areaList = res;
                //     this.params.area_id = res[0].id;
                //     break;
                default:
                    this.provinceList = res;
            }
        })
    }

    public async onChange(val, type?: any) {
        this.getList(val, type)
    }

    public handleCancel() {
        this.isVisible = false;
        this.form.body = {};
        this.params = {};
        this.params.pictures = [];
        this.form.clearError();
    }

    public onFormInit() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if(this.params.id) {
                body.id = this.params.id;
            }
            body.picture = this.params.picture;
            body.pictures = this.params.pictures;
            body.province_id = this.params.province_id;
            body.city_id = this.params.city_id;
        }
    }


    public handleOk() {
        if (!this.params.picture) {
            this.notification.info("提示信息", "请选择图片");
            return;
        }
        if (!this.params.city_id) {
            this.notification.info("提示信息", "请选择地址");
            return;
        }
        if(this.params.id) {
            this.form.action = 'school/teaching/school/update';
        }else {
            this.form.action = 'school/teaching/school/create';
        }
        this.form.submit().then(res => {
            this.handleCancel();
            this.notification.success('提示信息', `添加成功`);
            this.classService.refresh();
            this.collection.load();
        })
    }


    // 上传图片
    public uploadImg = async (item) => {
        this.upload(item, 'picture');
    }

    // 图集上传
    public atlasUploadImg = async (item) => {
        this.upload(item, 'pictures');
    }

    // 图片移除
    public removeFile(index) {
        this.params.pictures.splice(index,1);
    }

    public async upload(item, type) {
        let formData = new FormData();
        formData.set('images[]', item.file);
        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error('提示信息', `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }

        if (type == 'picture') {
            this.UploadLoading = true;
        } else {
            this.loading = true;
        }

        try {
            const data = await this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData);
            if (type == 'picture') {
                this.params.picture = data[0];
                this.UploadLoading = false;
            } else {
                this.params.pictures.push(data[0]);
                this.loading = false;
            }
        } catch (e) {
            this.loading = false;
            this.UploadLoading = false;
        }
    }

    public changeStatus(item) {
        if (item.status == 10 || item.status == -20) {
            this.http.post("school/teaching/school/open", { id: item.id }).then(ret => {
                this.notification.success("提示信息", item.status == 10 ? "开始运营成功" : "恢复运营成功");
                this.collection.load();
                this.classService.refresh();
            })
        } else if (item.status == 20) {
            this.http.post("school/teaching/school/close", { id: item.id }).then(ret => {
                this.notification.success("提示信息", "暂停运营成功");
                this.collection.load();
                this.classService.refresh();
            })
        }
    }
}
