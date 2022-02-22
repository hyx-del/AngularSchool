import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import * as dayjs from 'dayjs'
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny'
import { FileService } from '@/providers/file-service';
import { Config } from '@/config';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';

@Component({
    selector: 'school-semester-detail',
    templateUrl: './semester-detail.component.html',
    styleUrls: ['./semester-detail.component.scss']
})
export class SemesterDetailComponent implements OnInit, OnChanges {
    @Input() visible: boolean;

    @Input() id: number;

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    ossPath: string = "";

    public params: any = {};

    public timeRange: any = [];

    public dateRange: any = [];

    public todayDate = new Date();

    public form: nyForm;
    salesmanList: any[] = [];

    public provinceList: any = [];
    public cityList: any = [];

    isCityInit: boolean = false;

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
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
    }


    getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            (ret || []).forEach(item => {
                item.label = item.name + " " + item.mobile;
            });
            this.salesmanList = ret || [];
        })
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.visible && val.visible.currentValue) {
            this.getDetail();
        }
    }

    close() {
        this.visibleChange.emit();
    }

    public getDetail() {
        this.http.get("school/teaching-school/semester/detail?id=" + this.id).then(ret => {
            if (ret.salesman_ids) {
                ret.salesman_ids = ret.salesman_ids.map(item => parseInt(item));
            }
            this.form.body = ret;
            if (ret.province_id) ret.province_id = parseInt(ret.province_id);
            if (ret.city_id) ret.city_id = parseInt(ret.city_id);

            this.params = Object.assign({}, ret);
            // this.params = {
            //     id: ret.id,
            //     picture: ret.picture,
            //     register_mode: ret.register_mode,
            //     registered_number: ret.registered_number,
            //     is_contain_quarterage: ret.is_contain_quarterage,
            //     introduction: ret.introduction,
            // }
            if (ret.register_start_at && ret.register_end_at) {
                this.dateRange = [ret.register_start_at, ret.register_end_at];
            }
            if (ret.start_date && ret.end_date) {
                this.timeRange = [ret.start_date, ret.end_date];
            }

            this.isCityInit = true;
            if (!this.provinceList.length) {
                this.getList('province');
            } else {
                if (!this.params.province_id) {
                    this.params.province_id = this.provinceList[0].id;
                }
                this.getList('city', this.params.province_id);
            }
        })
    }

    public onChange(val) {
        this.isCityInit = false;
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
                    if (!this.params.province_id) {
                        this.params.province_id = arr[0].id;
                    }
                    this.getList('city', this.params.province_id);
                    break;
                case 'city':
                    this.cityList = arr;
                    if (!this.params.city_id || !this.isCityInit) {
                        this.params.city_id = arr[0].id;
                    }
                    break;
                default:
                    break;
            }
        });
    }

    handleSave() {
        this.form.action = 'school/teaching-school/semester/update';
        this.form.submit().then(res => {
            this.notification.success("提示信息", "修改成功");
            this.close();
        })
    }

    public subForm() {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = body => {
            body.id = this.params.id;
            body.picture = this.params.picture;
            body.introduction = this.params.introduction;
            body.register_mode = this.params.register_mode;
            body.meal_status = this.params.meal_status || null;
            // if (this.params.meal_status == -1) {
            //     body.meal_money = "";   
            // }
            
            if (this.params.poster_picture) {
                body.poster_picture = this.params.poster_picture;
            }
                        
            if (this.params.register_mode==10) {
                body.pay_online = this.params.pay_online;
            }else{
                body.pay_online = 1;
            }
            if (this.params.wx_picture) {
                body.wx_picture = this.params.wx_picture;
            }

            if (this.params.is_contain_quarterage) { // 
                body.is_contain_quarterage = 1;
            } else { // 学期不提供住宿，删除宿舍费
                body.quarterage = 0;
                body.is_contain_quarterage = 0;
            }

            if (this.params.register_mode == 20) {
                body.earnest = 0;
            }

            if (this.timeRange) {// 培训时间
                body.start_date = dayjs(this.timeRange[0]).format("YYYY-MM-DD");
                body.end_date = dayjs(this.timeRange[1]).format("YYYY-MM-DD");
            }

            if (this.dateRange) {// 报名时间
                body.register_start_at = dayjs(this.dateRange[0]).format("YYYY-MM-DD");
                body.register_end_at = dayjs(this.dateRange[1]).format("YYYY-MM-DD");
            }

            body.province_id = this.params.province_id || '';
            body.city_id = this.params.city_id || '';
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

    //学期详情表单图片提交
    public uploadImgComplete(data: any, type: number = 1) {
        if (type == 1) {
            this.params.picture = data.path;
        } else if (type == 2) {
            this.params.poster_picture = data.path;
        } else if (type == 3) {
            this.params.wx_picture = data.path;
        }
    }

    public disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.todayDate) < 0;
    };

}
