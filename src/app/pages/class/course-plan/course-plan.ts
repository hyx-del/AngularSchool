import { Component, OnInit } from '@angular/core';
import { Http, date, value } from "@yilu-tech/ny/index";
import { Collection, DateCondition } from "@yilu-tech/ny/search"
import { NzModalService, NzNotificationService } from "ng-zorro-antd";
import * as dayjs from 'dayjs';
import * as weekday from 'dayjs/plugin/weekday';
import * as toObject from 'dayjs/plugin/toObject';
import 'dayjs/locale/zh-cn'
import { ClassService } from '@/providers/index'
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import * as xlsx from 'xlsx';
import { Console } from 'console';

dayjs.extend(weekday);
dayjs.extend(toObject);
dayjs.locale('zh-cn'); // 使用本地化语言

@Component({
    selector: 'app-class-schedule',
    templateUrl: './course-plan.html',
    styleUrls: ['./course-plan.scss']
})
export class CoursePlan implements OnInit {

    public url: string;

    public buttons = [
        { name: 'create', click: () => this.addCourse() },
        { label: '切换模式', icon: 'swap', click: () => this.switchMode() },
        { label: '批量审核', dropdownGroup: true, click: () => this.audit() },
        { label: '下载模板', dropdownGroup: true, click: () => this.download() },
        { label: '导入', dropdownGroup: true, click: () => this.importData() },
    ];

    public collection: Collection = new Collection(this.http);

    public courseDetailVisible = false;

    public isAddCourse = true;

    public dateType = 1;

    public dateCycle: any[] = [{}];

    public maxNumber: number = 0;

    public cycleData: any[] = [
        { label: "星期一", value: 1 },
        { label: "星期二", value: 2 },
        { label: "星期三", value: 3 },
        { label: "星期四", value: 4 },
        { label: "星期五", value: 5 },
        { label: "星期六", value: 6 },
        { label: "星期日", value: 0 },
    ];

    public addCourseForm: nyForm;

    public courseList = [];

    public coachList = [];

    public classroomList = [];

    public isShowSchedules = true;

    public weeks: Array<any> = [
        { name: "周一", list: [], },
        { name: "周二", list: [], },
        { name: "周三", list: [], },
        { name: "周四", list: [], },
        { name: "周五", list: [], },
        { name: "周六", list: [], },
        { name: "周日", list: [], }
    ];

    public weekdayDate = [];

    public operationType: string;

    public end_time: any;

    public start_time: any;

    public titleTime: string;

    public rows = [];

    public isShowLoading = true;

    public weekdays = [];

    public todayDate = new Date();

    // public isRequestOff = false;

    // 详情
    public detailVisible = false;

    public detailForm: nyForm;

    public disabledDetail = false;

    public detailParams: any = {};

    constructor(
        private http: Http,
        private classService: ClassService,
        private nzModalService: NzModalService,
        private notification: NzNotificationService,
    ) {
    }

    ngOnInit() {
        this.url = 'school/teaching-class/course-plan/list?school_id=' + this.classService.getCurrentSchool().id;
        this.getCoachList();
        this.getClassroomList();
        this.setWeeksDate();
        this.getCourseData();
    }

    public setCollection(collection: Collection) {
        this.collection = collection;
        this.collection.showCheckbox = true;
        this.collection.onInit = () => {
            this.collection.size = 0;
            this.addDateCondition();
        };

        this.collection.onLoaded = (body) => {
            this.setWeekData(this.collection.data);
        };

        this.collection.onSetHeader = () => {
            this.collection.getHeader('class_name').click = (item) => this.courseDetails(item);
        }

    }

    // 列表形式
    public switchMode() {
        this.isShowSchedules = !this.isShowSchedules;
        this.addDateCondition();
    }

    // 设置周日期
    public setWeeksDate(type?: string) {
        let weekDate = null;
        switch (type) {
            case 'next':
                weekDate = this.end_time.add(1, 'day'); // 获取下周日期                
                break;
            case 'prev':
                weekDate = dayjs(this.start_time).subtract(1, 'week'); // 获取上一周的开始时间
                break;
            case 'init':
                weekDate = dayjs(this.start_time).weekday(0);
                break;
            default:
                weekDate = dayjs().weekday(0);
                break;
        }
        this.weeks = this.weeks.map((item, index) => {
            let date = weekDate.add(index, 'day').toObject();
            const dateTime = dayjs(weekDate.add(index, 'day')).format("YYYY-MM-DD");
            this.start_time = weekDate.add(0, 'day');// 记录开始的时间
            this.end_time = weekDate.add(index, 'day'); // 记录结束的时间

            this.setFormat(date);

            // @ts-ignore
            return { ...item, ...date, dateTime }
        });
    }

    // 设置时间格式
    public setFormat(date) {
        if (date.hasOwnProperty('months')) { // 判断自身属性是否存在
            date.months = date.months + 1;
            if (date.months < 10) {
                // @ts-ignore
                date.months = '0' + date.months;
            }
        }
        if (date.date && date.date < 10) {
            // @ts-ignore
            date.date = "0" + date.date;
        }
    }

    // 上一周
    public prev() {
        this.setWeeksDate('prev');



        this.addDateCondition();
        this.setTitleTime();
    }

    // 当前周
    public today() {
        this.setWeeksDate();
        this.addDateCondition();
        this.setTitleTime();
    }

    // 下一周
    public next() {
        this.setWeeksDate('next');
        this.addDateCondition();
        this.setTitleTime();
    }

    public addDateCondition() {
        const start_date = dayjs(this.start_time).toDate();

        let filed = this.collection.model.getProperty('start_at');
        let condition = null;
        if (this.isShowSchedules) {
            this.collection.size = 0;
            condition = filed.createCondition(DateCondition, start_date, '=');
            condition.required = true;
            condition.formatter = (value) => {
                value = [
                    dayjs(value).startOf('week').format('YYYY-MM-DD'),
                    dayjs(value).endOf('week').format('YYYY-MM-DD'),
                ];
                value.toString = () => value.join(' ~ ');
                return value;
            }
            
        } else {
            this.collection.size = 20;
            condition = filed.newCondition([
                dayjs().startOf('week').toDate(),
                dayjs().endOf('week').toDate()
            ]);
            condition.checked = true;
        }
        condition.onChange = () => {
            this.start_time = condition.minValue || condition.value;
            this.setWeeksDate('init');
            this.setTitleTime();
        }        
        this.collection.conditions.replace('start_at', condition)
        this.collection.loadReduce(0);
    }

    // 设置周课表数据格式
    public setWeekData(data) {
        let maxRows = 0;
        this.weeks.forEach(item => {
            item.list = [];
        });

        if (!data.length) {
            this.rows = [];
            this.isShowLoading = false;
            return;
        }

        const newDataList = data.filter(item => item.status != 30);

        this.weeks.forEach(weeksItem => {
            newDataList.forEach(item => {
                if (weeksItem.dateTime == item.date) {
                    weeksItem.list.push(item);
                }
            });
            if (weeksItem.list.length > maxRows) {
                maxRows = weeksItem.list.length;
            }
        });
        // @ts-ignore
        this.rows = Array(maxRows).fill().map((x, i) => i);
        this.isShowLoading = false;
    }

    // 设置标题时间
    public setTitleTime() {
        let start_at = this.start_time.toObject();
        let end_at = this.end_time.toObject();

        this.setFormat(start_at);
        this.setFormat(end_at);

        if (end_at.years == start_at.years) {
            this.titleTime = `${start_at.years}年${start_at.months}月${start_at.date}日 - ${end_at.months}月${end_at.date}日`
        } else {
            this.titleTime = `${start_at.years}年${start_at.months}月${start_at.date}日 - ${end_at.years}年${end_at.months}月${end_at.date}日`
        }
    }

    // 添加排课按钮
    public addCourse(item?) {
        this.courseDetailVisible = true;
        if (item) {
            this.addCourseForm.body.date = item.dateTime;
        }
    }

    // 获取教练
    public getCoachList() {
        this.http.get('school/index/coach/list').then(res => {
            this.coachList = res;
        })
    }

    // 获取教室
    public getClassroomList() {
        const data = this.classService.getCurrentSchool();
        this.http.get('school/teaching-school/school/get-classroom-list', { school_id: data.id }).then(res => {
            this.classroomList = res;
        })
    }

    public getCourseData() {
        this.http.post('school/teaching-class/course/get-list').then(res => {
            this.courseList = res;
        })
    }

    // 添加排课表单
    public subCourseForm() {
        this.addCourseForm.request = this.http.request.bind(this.http);
        this.addCourseForm.onSubmit = (body) => {
            if (this.dateType == 1) {
                if (body.date) {
                    body.date = dayjs(body.date).format('YYYY-MM-DD');
                }
                body.date_type = 1;
            } else {
                body.start_date = dayjs(this.weekdayDate[0]).format("YYYY-MM-DD");
                body.end_date = dayjs(this.weekdayDate[1]).format("YYYY-MM-DD");
                body.date_type = 2;

                if (this.weekdays.length) {
                    body.weekdays = this.weekdays;
                }
            }

            if (body.start_at) {
                body.start_at = dayjs(body.start_at).format('HH:mm');
            }
            if (body.end_at) {
                body.end_at = dayjs(body.end_at).format('HH:mm');
            }

        }
    }

    public onFormBodyChange(change) {
        if (change.name == 'classroom_id') {
            this.setCourseMaxNumber();
            this.setNyName();
        }
    }

    private setCourseMaxNumber() {
        let body = this['addCourseForm'].getBody();
        let classRoom = this.classroomList.find(item => item.id == body.classroom_id);
        this.maxNumber = classRoom.max_number;
    }

    private setNyName() {
        this.addCourseForm.setValue("max_number", this.maxNumber);
    }

    public disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.todayDate) < 0;
    };

    public courseAddHandelOk() {
        if (this.dateType == 2 && !this.weekdayDate.length) {
            this.notification.info('提示信息', '请选择日期!');
            return;
        }
        this.addCourseForm.action = 'school/teaching-class/course-plan/create';
        this.addCourseForm.submit().then(res => {
            this.notification.success('提示信息', '添加成功');
            this.courseAddHandleCancel();
            this.collection.load();
        }).catch(error => {
            if (error.error && error.error.data) {
                if (Object.keys(error.error.data).length) {
                    this.confirmPartSubmit(error.error.data || []);
                }
            }
        })
    }

    public confirmPartSubmit(errorData: Array<any>, isImport = false) {
        let content = "";
        if (errorData.hasOwnProperty('semesterEndDate')) return; 
        for (const key in errorData) {
            if (key == 'status') {
                continue;
            }
            content += `<div style="margin-bottom: 0;">${errorData[key]}</div>`;
        }

        this.nzModalService.confirm({
            nzTitle: `${isImport ? '导入' : '排课'}存在以下冲突，请重新调整`,
            nzContent: content,
            nzWidth: 520,
            nzCancelText: null,
            nzOnOk: () => {

            },
        })
    }

    public courseAddHandleCancel() {
        this.courseDetailVisible = false;
        this.addCourseForm.body = {};
        this.weekdayDate = null;
        this.weekdays = [];
        this.dateType = 1;
        this.isAddCourse = false;
    }

    // 审核
    public audit(item?: any) {
        let params: any = {}
        if (item) {
            params.course_plan_id = [item.id]
        } else {
            if (!this.collection.checkedItems.length) {
                this.notification.info('提示信息', '请选择要审核的课程！');
                return;
            }
            params.course_plan_id = this.collection.checkedItems.map(item => item.id);
        }
        this.nzModalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要审核？',
            nzOnOk: () => {
                this.http.post('school/teaching-class/course-plan/check', params).then(res => {
                    this.notification.success('提示信息', '审核成功');
                    if (this.detailParams.id) {
                        this.courseDetails(item);
                    }
                    this.collection.load();
                })
            }
        })
    }

    public file: HTMLInputElement;

    // 下载模板
    private download() {
        const elA = document.createElement('a');
        elA.setAttribute('href', '../../../../assets/img/template.xls');
        elA.setAttribute('download', '课表模板');
        elA.click();
    }

    // 导入数据
    private importData() {
        this.file = document.createElement('input');
        this.file.type = 'file';
        this.file.click();
        this.file.onchange = () => {
            if (this.file.files.length) {
                let fileName = this.file.files[0].name;
                let temp = fileName.split('.');
                let suffix = temp[temp.length - 1].toUpperCase();
                if (suffix !== 'XLSX' && suffix !== 'XLS') {
                    this.notification.warning('提示信息', '请选择文件扩展名为xlsx的文件');
                } else {
                    this.readFileData(suffix);
                    // this.goodsImportVisible = true;
                }
            }
        };
    }

    public readFileData(suffix) {
        let fileReader = new FileReader();
        if (suffix === 'CSV') {
            // fileReader.readAsText(this.file.files[0], this.encode);
        } else {
            fileReader.readAsBinaryString(this.file.files[0]);
        }
        fileReader.onload = (ev) => {
            this.doXlsx(ev.target['result']);
        };
    }

    private doXlsx(data: any) {
        let workBook = xlsx.read(data, { type: 'binary' });
        let origin = xlsx.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]], { raw: true, defval: "" });
        if (!origin.length) return;

        // this.origin.header = this.makeHeader(Object.keys(origin[0]));
        let dataArray = [];
        origin.forEach((item) => {
            let data = Object.values(item);
            if (data.filter((_) => _).length) {
                dataArray.push(data);
            }
        });

        let keys = ['course_name', 'coach_name', 'coach_mobile', 'classroom_name', 'date', 'start_at', 'end_at'];

        let params = []
        dataArray.forEach(item => {
            let obj = {};
            for (const index in Object.values(item)) {
                obj[keys[index]] = Object.values(item)[index]
            }
            params.push(obj)
        })

        this.importRequest(params);
    }

    private importRequest(params) {
        this.http.post('school/teaching-class/course/import', { data: params }).then(res => {
            this.notification.success('提示信息', '导入成功!');
            this.collection.load();
        }).catch(error => {
            if (error.error && error.error.data) {
                if (Object.keys(error.error.data).length) {
                    this.confirmPartSubmit(error.error.data || [], true);
                }
            }
        })
    }


    public cancelCourse(item) {
        this.nzModalService.confirm({
            nzTitle: '提示信息',
            nzContent: '确定要取消？',
            nzOnOk: () => {
                this.http.post('school/teaching-class/course-plan/cancel', { id: item.id }).then(res => {
                    this.notification.success('提示信息', '取消成功');
                    if (this.detailParams.id) {
                        this.courseDetails(item);
                    }
                    this.collection.load();
                })
            }
        })
    }

    // 详情
    public courseDetails(item) {
        if (!item) {
            return;
        }
        this.detailVisible = true;
        this.http.post('school/teaching-class/course-plan/detail', { id: item.id }).then(res => {
            res.start_at = dayjs(res.start_at).toDate();
            res.end_at = dayjs(res.end_at).toDate();

            this.detailForm.body = res;
            this.detailParams = res;
            if (this.detailParams.status == 30) {
                this.disabledDetail = true;
            }
        });
    }

    public detailsHandleCancel() {
        this.detailVisible = false;
        this.detailParams = {};
        this.detailForm.body = {};
        this.disabledDetail = false;
    }

    // 修改
    public save() {
        this.detailForm.action = 'school/teaching-class/course-plan/update';
        this.detailForm.submit().then(res => {
            this.notification.success('提示信息', '修改成功');
            this.detailVisible = false;
            this.collection.load();
        }).catch(error => {
            if (error.error && error.error.data) {
                if (Array.isArray(error.error.data)) {
                    this.confirmPartSubmit(error.error.data || []);
                }
            }
        })
    }

    public subDetailForm() {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.onSubmit = body => {
            body.id = this.detailParams.id;
            body.date_type = 1;
            if (body.start_at) {
                body.start_at = dayjs(body.start_at).format('HH:mm:ss');
            }
            if (body.end_at) {
                body.end_at = dayjs(body.end_at).format('HH:mm:ss');
            }

            if (body.date) {
                body.date = dayjs(body.date).format('YYYY-MM-DD');
            }
        }
    }


    // 添加日期
    // public addDateCycle() {
    //     this.dateCycle.push({});
    // }

    // public removeDateCycle(index: number) {
    //     this.dateCycle.splice(index, 1);
    // }

}
