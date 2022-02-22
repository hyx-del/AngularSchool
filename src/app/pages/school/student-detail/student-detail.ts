import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from "@yilu-tech/ny/index";
import { FileService } from "@/providers/file-service";
import { ClassService } from "@/providers/index";
import { NzNotificationService, NzTabChangeEvent } from "ng-zorro-antd";
import { Config } from "@/config";
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import * as dayjs from 'dayjs';

@Component({
    selector: 'student-detail',
    templateUrl: './student-detail.html',
    styleUrls: ['./student-detail.scss']
})
export class StudentDetail implements OnInit, OnChanges {
    @Input() detailVisible: boolean;

    @Input() detailData: any;

    @Input() provinceList: Array<any>;

    @Input() cliqueList: Array<any>;

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    public ossPath: string;

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

    constructor(
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
        private router: Router,
        private classService: ClassService,
        private cdr: ChangeDetectorRef,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.searchChange$.asObservable().pipe(debounceTime(500)).subscribe(value => {
            this.pageIndex = 1;
            this.getAllMember(value, true);
        });
        this.getSalesmanList();
        if (!this.schoolList.length) {
            this.schoolList = this.classService.getSchoolList();
        }
        this.getDetailInitData();
        this.getSourceChannelList();
    }

    ngOnChanges(val: SimpleChanges) {
        if (val.detailVisible.currentValue && val.detailData.currentValue) {
            this.params = Object.assign({}, { id: this.detailData.id });
            this.getDetailData();
        }
    }

    public detailForm: nyForm;

    public params: any = {};

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


    public uploadLoading = false;

    public picture: string;

    public sexValue = 1;

    public cityList = [];

    public areaList = [];
    salesmanList: any[] = [];

    detailSourceIsStaff: boolean = false;
    // 详情来源渠道为转介绍
    detailSourceIsSales: boolean = false;
    detailSourceIsOther: boolean = false;

    // 意向学习时间
    detailExpectedTime: Array<any> = [];

    public getDetailData() {
        this.http.get('school/teaching-school/student/detail', { id: this.detailData.id }).then(res => {
            if (res['student_info']) {
                delete res['student_info']['created_at'];
                res['student_info']['lastLogUpdateTime'] = res['student_info']['updated_at']
                if (!res['student_info']['additional_data']) {
                    res['student_info']['additional_data'] = {};
                }
                delete res['student_info']['updated_at'];
                Object.assign(res, res.student_info);
            }

            if (res.expected_start_time && res.expected_end_time) {
                this.detailExpectedTime = [res.expected_start_time, res.expected_end_time];
            } else {
                this.detailExpectedTime = [];
            }

            this.detailForm.body = res;
            this.detailForm.body.genre = res.genre_value;            
			this.picture = res.avatar;
            this.params = Object.assign({},res);

            this.setDetailSourceStatus(res.source_ids || []);

			if (this.params.province_id) {
				this.getList(this.params.province_id, 'province');
			}
        })
    }

    getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            this.salesmanList = ret || [];
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

    tabsInit: any = {};

    tabChange(event: NzTabChangeEvent) {
        if (!this.tabsInit[event.index]) {
            this.tabsInit[event.index] = true;
        }
    }
	
	public saveMember() {
		if(!this.params.province_id && !this.params.city_id && !this.params.area_id) {
            this.notification.info('提示信息','请选择地址!');
            return;
        }
        this.detailForm.action = 'school/teaching-school/student/update';
        this.detailForm.submit().then(res => {
            this.notification.success('提示信息', '修改成功');
            // this.cancel();
        });
    }

    public subInfoForm() {
        this.detailForm.request = this.http.request.bind(this.http);
        this.detailForm.onSubmit = (body) => {
            body.id = this.detailForm.body.id;
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

    onDetailFormChange(event) {
        if (event.name == "source_ids") {
            let sourceIds = event.value || [];
            this.setDetailSourceStatus(sourceIds);
        }
    }

    setDetailSourceStatus(sourceIds) {
        let currentSourceChannel = this.sourceChannelList.filter(item => sourceIds.indexOf(item.id) != -1);
        let channelNames = currentSourceChannel.map(item => item.name);
        
        if (sourceIds && sourceIds.length) {
            this.detailSourceIsStaff = channelNames.indexOf("员工家属") != -1;
            this.detailSourceIsSales = channelNames.indexOf("转介绍") != -1;
            this.detailSourceIsOther = channelNames.indexOf("其他") != -1;
        } else {
            this.detailSourceIsStaff = false;
            this.detailSourceIsSales = false;
            this.detailSourceIsOther = false;
        }
        this.cdr.detectChanges();
    }
	
	//上传图片
    public uploadImgComplete(data: any) {        
        this.picture = data.path;
	}
	
	public onChange(val, type) {
        this.getList(val, type)
    }

    public cancel() {		
        this.visibleChange.emit(false);
    }

    // 报名记录
    applyCollection: any = {};
    previewVisible: boolean = false;
    previewImageUrl: string = "";
    jumpIndex: number = 0;

    setApplyCollection(collection) {
        this.applyCollection = collection;
        this.applyCollection.onSetHeader = () => {
            this.applyCollection.getHeader('semester_name').click = (item) => this.toSignUpDetail(item);
        }
    }


    toSignUpDetail(item) {
        this.jumpIndex++;
        this.router.navigate(["/school/sign-up"], { queryParams: { id: item.id,i: this.jumpIndex }});
    }

    showPreviewImages(item) {
        this.previewImageUrl = item.certificate;
        this.previewVisible = true;
    }

    closeModal() {
        this.previewVisible = false;
    }

    // 
    collection: any = {};
    setCollection(collection) {
        this.collection = collection;
    }
    
    // 线索记录
    introduceCollection: any = {};
    setIntroduceCollection(collection) {
        this.introduceCollection = collection;
    }

    // 跟进记录
    followContent: string = "";
    logVisible: boolean = false;
    followButtons: any = [
        { name: 'create', click: () => this.showFollowLog() },
    ]
    followCollection: any = {};
    logParams: any = {};
    logForm: nyForm;
    goalList: any[] = [];
    communicateList: any[] = [];
    studentPostionList: any[] = [];
    resourceList: any[] = [];
    schoolList: any[] = [];
    consultingCourseList: any[] = [];

    // 来源渠道列表
    sourceChannelList: any[] = [];

    // 来源渠道 类型
    sourceIsStaff: boolean = false;
    // 来源渠道为 转销售
    sourceIsSales: boolean = false;
    sourceIsOther: boolean = false;

    // 意向学习时间
    expectedTime: Array<any> = [];

    setFollowCollection(collection) {
        this.followCollection = collection;
        this.followCollection.onSetHeader = () => {
            if (this.followCollection.headers) {
                this.followCollection.headers.forEach(header => {
                    if (header.field == "created_at") {
                        header.minWidth = "180px";
                    } else {
                        header.minWidth = "100px";
                    }
                });
            }
        }
    }

    getDetailInitData() {
        if (!this.goalList.length) {
            this.getGoalList();
        }
        if (!this.consultingCourseList.length) {
            this.getConsultingCourseList();
        }
        if (!this.communicateList.length) {
            this.getCommunicate();
        }
        if (!this.studentPostionList.length) {
            this.getStudentPosition();
        }
        if (!this.resourceList.length) {
            this.getResourceList();
        }
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
            if (this.params.source_ids) {
                this.setDetailSourceStatus(this.params.source_ids || []);
            }
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

    // 沟通方式
    getCommunicate() {
        this.http.post("school/teaching/communicate/get-list").then(ret => {
            this.communicateList = ret || [];
        });
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


    logFormInit() {
        this.logForm.request = this.http.request.bind(this.http);
        this.logForm.action = "school/teaching-school/student/follow-create";
        this.logForm.onSubmit = (body) => {
            body.student_id = this.params.id;
            body.gender = this.logParams.gender;

            if (this.logParams.province_id) {
                body.province_id = this.logParams.province_id;
                body.city_id = this.logParams.city_id;
                body.area_id = this.logParams.area_id;
            }
            if (!body.wechat_id) {
                delete body.wechat_id;
            }
            if (!body.mobile) {
                delete body.mobile;
            }
            if (this.expectedTime && this.expectedTime.length) {
                body.expected_start_time = dayjs(this.expectedTime[0]).format("YYYY-MM-DD HH:mm:ss");
                body.expected_end_time = dayjs(this.expectedTime[1]).format("YYYY-MM-DD HH:mm:ss");
            }
        }
    }

    logFormChange(event: any) {
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

    createFollowLog() {
        this.logForm.submit().then(() => {
            this.notification.success("提示信息", "创建成功");
            this.cancelLog();
            this.followCollection.load();
            this.getDetailData();
        });
    }
    showFollowLog() {
        if (this.params.expected_start_time && this.params.expected_end_time) {
            this.expectedTime = [this.params.expected_start_time, this.params.expected_end_time];
        }
        this.logVisible = true;
        if (this.logForm) {
            this.logForm.body = Object.assign({}, this.params);
        }
        this.getDetailInitData();
        this.logParams = Object.assign({}, this.params);
        if (!this.logParams.gender) {
            this.logParams.gender = 2;
        }
        let sourceIds = this.logParams.source_ids || []
        this.setSourceStatus(sourceIds);
        this.setFollowLogDisabled();
    }

    // 添加跟进记录 来源渠道和咨询校区 不能删除 只能修改
    setFollowLogDisabled(isReset: boolean = false) {
        let schoolIds = this.logParams.consult_school_ids || [];
        let sourceIds = this.logParams.source_ids || []

        if (sourceIds.length) {
            this.sourceChannelList.forEach(item => {
                if (isReset) {
                    item.disabled = false;
                } else if (sourceIds.indexOf(item.id) != -1) {
                    item.disabled = true;
                }
            })
        }
        this.schoolList.forEach(item => {
            if (schoolIds.indexOf(item.id) != -1) {
                if (isReset) {
                    item.disabled = false;
                } else {
                    item.disabled = true;
                }
            }
        })
    }

    cancelLog() {
        this.logVisible = false;
        this.followContent = "";
        this.logParams = {};
        this.logForm.body = {};
        this.logForm.clearError();
        this.setSourceStatus([]);
        this.setFollowLogDisabled(true);
        this.expectedTime = [];
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

}
