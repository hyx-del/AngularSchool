import { Component, OnInit } from '@angular/core';
import * as dayjs from 'dayjs'
import { Config } from "@/config";
import { FileService } from "@/providers/file-service";
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http, number } from '@yilu-tech/ny'
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

@Component({
    selector: 'app-semester',
    templateUrl: './semester.component.html',
    styleUrls: ['./semester.component.scss']
})
export class SemesterComponent implements OnInit {
    public semesterAddIsVisible = false;

    public collection: any = {};

    public params: any = {
        register_mode: 20,
        meal_status: 1,
        is_contain_quarterage: 1,
        pay_online:2
    };

    public images: any;

    public form: nyForm;

    public buttons = [
        { name: 'create', click: () => this.showAddModal() }
    ]

    public timeRange = [];

    public dateRange = [];

    public uploadLoading = false;

    public introduction: string = '';

    public ossPath: string;

    public otherSemester = null;

    public otherSemesterList = null;
    salesmanList: any[] = [];

    public provinceList: any = [];
    public cityList: any = [];
    schoolInfo: any = {};

    entryFee: any = '0';

    constructor(
        private modalService: NzModalService,
        private notification: NzNotificationService,
        private http: Http,
        private fileService: FileService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getList('province');
        this.http.get("school/teaching-school/school/get-school").then(ret => {
            this.schoolInfo = ret;
        })
    }

    setCollection(collection) {
        this.collection = collection;
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.details(item);
        }
    }

    public onChange(val) {
        this.getList('city', val);
    }

    public getList(type: 'province' | 'city' = 'province', id?: number, ) {
        let params: any = {};

        if (id) {
            params.id = id;
        }

        this.http.post('school/teaching/school/address-select', params).then(ret => {
            let arr: any = ret || [];
            switch (type) {
                case 'province':
                    this.provinceList = arr;
                    this.params.province_id = arr[0].id;
                    this.getList('city', this.params.province_id);
                    break;
                case 'city':
                    this.cityList = arr;
                    this.params.city_id = arr[0].id;
                    break;
                default:
                    break;
            }
        });
    }

    /****************************添加学期x(表单)********************************/
    showAddModal() {
        this.getSemesterList();
        this.semesterAddIsVisible = true;
        this.form.body = {
            number: 1,
            is_contain_quarterage: 1,
            address: this.schoolInfo.address || '',
        };
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
        if (this.schoolInfo.province_id) {
            Object.assign(this.params, {
                province_id: parseInt(this.schoolInfo.province_id),
                city_id: parseInt(this.schoolInfo.city_id),
            })
            this.getList('city', this.params.province_id || '');
        }
    }

    public getSemesterList() {
        this.http.get('school/index/school/semester-template-list').then(res => {          
            this.otherSemesterList = res;
        })
    }
    
    getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            (ret || []).forEach(item => {
                item.label = item.name + " " + item.mobile;
            });
            this.salesmanList = ret || [];
        })
    }

    public sure() {
        this.http.get('school/index/school/semester-template-detail', { id: this.otherSemester }).then(res => {
            const params = ['picture', 'is_contain_quarterage', 'register_mode',     'pay_online','contact', 'poster_picture', 'wx_picture'];
            const bodyParams = ['number', 'tuition', 'deposit', 'category', 'contact'];

            this.introduction = res.introduction;

            if (res.is_contain_quarterage == 0) {
                this.form.body.quarterage = res.quarterage;
            }

            if (res.register_mode == 10) {
                this.form.body.earnest = res.earnest;
                this.isSelectRodio = true;
            } else {
                this.isSelectRodio = false;
            }

            for (const value of Object.values(params)) {
                this.params[value] = res[value];
            }

            for (const value of Object.values(bodyParams)) {
                this.form.body[value] = res[value]
            }

        })
    }

    public semesterAddHandleCancel() {
        this.semesterAddIsVisible = false;
        this.isSelectRodio = false;
        this.params = {
            register_mode: 20,
            is_contain_quarterage: 1,
            picture: null,
            meal_status: 1,
            pay_online:2
        };
        this.introduction = '';
        this.otherSemester = null;
        this.form.clearError();
        this.dateRange = [];
        this.timeRange = [];
    }

    //上传图片
    public uploadImgComplete(data: any, type: number = 1) {
        if (type == 1) {
            this.params.picture = data.path;
        } else if (type == 2) {
            this.params.poster_picture = data.path;
        } else if (type == 3) {
            this.params.wx_picture = data.path;
        }
    }

    //添加
    handleSave() {
        this.form.action = "school/teaching-school/semester/create";
        this.form.submit().then(ret => {
            this.notification.success("提示信息", this.params.id ? "修改成功" : "创建成功");
            this.semesterAddHandleCancel();
            this.collection.load();
        })
    }

    public onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.names = ["id"];
        this.form.onSubmit = (body) => {
            //是否包含学费
            if (this.params.is_contain_quarterage) {
                body.is_contain_quarterage = 1;
                // if (!body.quarterage) {
                //     body.quarterage = 1;
                // }
            } else {
                body.is_contain_quarterage = 0;
            }
            //培训日期
            if (this.timeRange.length) {
                body.start_date = dayjs(this.timeRange[0]).format("YYYY-MM-DD");
                body.end_date = dayjs(this.timeRange[1]).format("YYYY-MM-DD");
            }
            //报名日期
            if (this.dateRange.length) {
                body.register_start_at = dayjs(this.dateRange[0]).format("YYYY-MM-DD");
                body.register_end_at = dayjs(this.dateRange[1]).format("YYYY-MM-DD");
            }
            if (this.params.picture) {
                body.picture = this.params.picture;
            }
            if (this.params.poster_picture) {
                body.poster_picture = this.params.poster_picture;
            }
            if (this.params.wx_picture) {
                body.wx_picture = this.params.wx_picture;
            }

            body.province_id = this.params.province_id || '';
            body.city_id = this.params.city_id || '';

            body.register_mode = this.params.register_mode;
            if (this.params.register_mode==10) {
                body.pay_online = this.params.pay_online;
            }else{
                body.pay_online = 1;
            }
            body.meal_status = this.params.meal_status || 1;

            body.introduction = this.introduction;
        }
    }

    onFormChange(event) {
        if (event.name == 'registration_fee' || event.name == 'quarterage' || event.name == 'meal_money' || event.name == 'earnest') {
            let data = event.body;

            // 报名费=培训费+住宿费+餐费+定金
            let tuition = parseFloat(data.registration_fee || 0) - parseFloat(data.quarterage || 0) - parseFloat(data.meal_money || 0) - parseFloat(data.earnest || 0);
            
            // 设置培训费
            this.form.setValue("tuition", tuition);
        }
    }

    public today = new Date();

    disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.today) < 0;
    }

    public isSelectRodio = false;

    public modeValueChange(value: any) { // Switch 按钮
        if (value == 10) {
            this.isSelectRodio = true;
        } else {
            this.isSelectRodio = false;
        }
    }

    public detailId: number;


    //学期详情
    public detailsVisible = false;

    public details(item: any) {
        this.detailId = item.id;
        this.detailsVisible = true;
    }

    public statusChange(item, status?: number) {
        let txt: string;
        let url: string;
        let successInfo: string;

        switch (status) {
            case 1:
                txt = "确定上线该学期";
                successInfo = '上线成功'
                url = "school/teaching-school/semester/online"
                break;
            case 0:
                txt = "确定未发布该学期";
                successInfo = '未发布'
                url = "school/teaching-school/semester/unpublished"
                break;
            default:
                txt = "确定下线该学期";
                successInfo = '下线成功'
                url = "school/teaching-school/semester/offline"
                break;
        }

        this.modalService.confirm({
            nzTitle: txt,
            nzOnOk: () => {
                this.http.post(url, { id: item.id }).then(() => {
                    this.notification.success("提示信息", successInfo);
                    this.collection.load();
                })
            }
        })
    }

    public semDelete(item) {
        this.modalService.confirm({
            nzTitle: "确定删除这个学期",
            nzOnOk: () => {
                this.http.post("school/teaching-school/semester/delete", {
                    id: item.id,
                    is_used: item.is_used,
                }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
    }

    //关闭详情窗口时，刷新列表
    public refush() {
        this.collection.load();
        this.detailsVisible = false;
    }


}

