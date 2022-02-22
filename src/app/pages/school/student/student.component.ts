import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { Config } from "@/config";
import { FileService } from "@/providers/file-service";
import { ClassService } from "@/providers/index";
import { NzNotificationService } from "ng-zorro-antd";
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
    selector: 'app-student',
    templateUrl: './student.component.html',
    styleUrls: ['./student.component.scss']
})
export class StudentComponent implements OnInit {
    public ossPath: string;

    constructor(
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
        private classService: ClassService,
        private cdr: ChangeDetectorRef,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    collection: any = {};

    public addStudentVisible = false;

    public infoForm: nyForm;

    public params: any = {};

    public buttons = [
        { name: 'create', click: () => this.addStudent() }
    ];

    public statusData = [
        { label: '潜在', value: 10 },
        { label: '学员', value: 20 },
        { label: '毕业', value: 30 },
    ];

    public registerGradeData = [
        { label: '无', value: 0 },
        { label: '普通', value: 10 },
        { label: '高级', value: 20 },
    ];

    baseStatus: any[] = [
        { label: "零基础", value: 5 },
        { label: "有练习基础", value: 6 },
        { label: "有教练培训基础", value: 7 },
        { label: "其他", value: 4 },
    ];
    studyIntentionStatus: any[] = [
        { label: "很强", value: 1 },
        { label: "中等", value: 2 },
        { label: "一般", value: 3 },
        { label: "弱", value: 4 },
        { label: "暂无", value: 5 },
    ];

    public faction;

    public uploadLoading = false;

    public picture: string;

    public sexValue = 1;

    public provinceList = [];

    public cityList = [];

    public areaList = [];

    salesmanList: any[] = [];


    sourceChannelList: any[] = [];
    schoolList: any[] = [];


    goalList: any[] = [];
    studentPostionList: any[] = [];
    resourceList: any[] = [];
    consultingCourseList: any[] = [];

    // 来源渠道 类型
    sourceIsStaff: boolean = false;
    // 来源渠道为 转销售
    sourceIsSales: boolean = false;
    sourceIsOther: boolean = false;

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        });
        this.getSalesmanList();
        this.getList();
        this.getClique();
        this.schoolList = this.classService.getSchoolList();
    }

    setCollection(collection) {
        this.collection = collection;
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.details(item);
        }
    }

    getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            this.salesmanList = ret || [];
        })
    }

    // 来源渠道
    getSourceChannelList() {
        let params: any = {
            "action": "query",
            "params": [],
            "fields": ["id", "name"],
            "orderBy": "default_source asc",
        }
        this.http.post("hall/member/common/source/list", params).then(ret => {
            this.sourceChannelList = ret || [];
        })
    }

    // 学习目的
    getGoalList() {
        this.http.post("school/teaching/goal/get-list").then(ret => {
            this.goalList = ret || [];
        })
    }

    // 获取咨询课程
    getConsultingCourseList() {
        this.http.post("school/teaching/consulting-course/get-list").then(ret => {
            this.consultingCourseList = ret || [];
        })
    }

    // 学员身份
    getStudentPosition() {
        this.http.post("school/teaching/position/get-list").then(ret => {
            this.studentPostionList = ret || [];
        });
    }

    // 资源类型
    getResourceList() {
        this.http.post("school/teaching/resource/get-list").then(ret => {
            this.resourceList = ret || [];
        });
    }

    // 添加学生
    public addStudent() {
        this.addStudentVisible = true;
        if (!this.salesmanList.length) {
            this.getSalesmanList();
        }
        if (!this.sourceChannelList.length) {
            this.getSourceChannelList();
        }
        if (!this.referrerMember.length) {
            this.getAllMember();
        }
        if (!this.goalList.length) {
            this.getGoalList();
        }
        if (!this.consultingCourseList.length) {
            this.getConsultingCourseList();
        }
        if (!this.studentPostionList.length) {
            this.getStudentPosition();
        }
        if (!this.resourceList.length) {
            this.getResourceList();
        }

    }

    public subInfoForm() {
        this.infoForm.request = this.http.request.bind(this.http);
        this.infoForm.onSubmit = (body) => {
            if (this.params.id) {
                body.id = this.params.id;
            }
            body.gender = this.sexValue;
            if (this.picture) {
                body.avatar = this.picture;
            }
            if (this.params) {
                body.province_id = this.params.province_id;
                body.city_id = this.params.city_id;
                body.area_id = this.params.area_id;
            }
            if (!body.wechat_id) {
                delete body.wechat_id;
            }
            if (!body.mobile) {
                delete body.mobile;
            }
        }
    }

    onFormChange(event: any) {
        if (event.name == "source_ids") {
            let sourceIds = event.value || [];
            this.setSourceStatus(sourceIds);
        }
    }

    setSourceStatus(sourceIds: any[]) {
        let currentSourceChannel = this.sourceChannelList.filter(item => sourceIds.indexOf(item.id) != -1);
        let channelNames = currentSourceChannel.map(item => item.name);
        
        if (sourceIds && sourceIds.length) {
            this.sourceIsStaff = channelNames.indexOf("员工家属") != -1;
            this.sourceIsSales = channelNames.indexOf("转介绍") != -1;
            this.sourceIsOther = channelNames.indexOf("其他") != -1;
        } else {
            this.sourceIsStaff = false;
            this.sourceIsSales = false;
            this.sourceIsOther = false;
        }
        this.cdr.detectChanges();
    }

    public saveMember() {
        if (!this.params.province_id && !this.params.city_id && !this.params.area_id) {
            this.notification.info('提示信息', '请选择地址!');
            return;
        }

        if (this.params.id) {
            this.infoForm.action = 'school/teaching-school/student/update';
        } else {
            this.infoForm.action = 'school/teaching-school/student/create';
        }
        this.infoForm.submit().then(res => {
            this.notification.success('提示信息', `${this.params.id ? '修改成功' : '添加成功'}`);
            this.cancelMemberEditor();
            this.collection.load();
        })
    }

    public cancelMemberEditor() {
        this.addStudentVisible = false;
        this.infoForm.body = {};
        this.params = {};
        this.picture = null;
        this.infoForm.clearError();
    }

    //上传图片
    public uploadImg = (item: any) => {
        let formData = new FormData();
        formData.set('images[]', item.file);
        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error('提示信息', `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.uploadLoading = true;
        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(res => {
            this.picture = res[0];
            this.uploadLoading = false;
        }).catch(error => {
            this.uploadLoading = false;
        })
    }


    // 获取省市区
    public getList(id?, type?) {
        let params: any = {};
        if (id) {
            params.id = id;
        }
        this.http.post('school/teaching/school/address-select', params).then(res => {
            switch (type) {
                case 'province':
                    this.cityList = res;
                    this.params.city_id = res[0].id;
                    this.getList(this.params.city_id, 'city');
                    break;
                case 'city':
                    this.areaList = res;
                    this.params.area_id = res[0].id;
                    break;
                default:
                    this.provinceList = res;
            }
        })
    }

    public onChange(val, type) {
        this.getList(val, type)
    }

    public async getClique() {
        const result = await this.http.post('school/teaching/clique/get-list');
        this.faction = result;
    }

    // 推荐人

    referrerIsLoading: boolean = false;

    public referrerMember: any[] = [];
    private keyword: string = "";
    private searchChange$ = new Subject<any>();
    private haveMoreMember: boolean = false;
    private pageIndex: number = 1;

    public onSearch(value: string): void {
        this.referrerIsLoading = true;
        this.keyword = value;
        this.searchChange$.next(value);
    }

    public loadMore() {
        if (this.referrerIsLoading || !this.haveMoreMember) {
            return;
        }
        this.pageIndex += 1;
        this.referrerIsLoading = true;
        this.getAllMember(this.keyword);
    }
 
    private getAllMember(keyword: string = '', isSearch: boolean = false) {
        let params: any = {
            page: this.pageIndex,
            // size: 100,
        };
        if (keyword) {
            params.keyword = keyword;
        }

        this.http.get("member/common/member/member-list", params).then(ret => {
            (ret.data || []).forEach(item => {
                item.label = item.name + "  " + item.contact;
            });
            if (isSearch) {
                this.referrerMember = ret.data || [];
            } else {
                this.referrerMember = this.referrerMember.concat(ret.data || []);
            }

            if (ret.last_page > ret.current_page) {
                this.haveMoreMember = true;
            } else {
                this.haveMoreMember = false;
            }
            this.referrerIsLoading = false;
            this.pageIndex = ret.current_page;
        })
    }

    /**
     * 详情
     */
    public detailVisible = false;
    public isInitDetail: boolean = false;

    public detail: any;

    public details(item) {
        this.detail = item;
        if (!this.isInitDetail) {
            this.isInitDetail = true;
        }
        this.detailVisible = true;
    }

    public close(callback: boolean) {
        this.collection.load();
        this.detailVisible = callback;
    }
}
