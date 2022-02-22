import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { ActivatedRoute } from '@angular/router';
import { Http } from '@yilu-tech/ny';
import { Observable } from 'rxjs';
import { Config } from '@/config';
import { ClassService, FileService } from '@/providers/index';
import { Export } from '../../../../providers/utils';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
    public collection: any = {};

    public isShow = false;

    public isVisible = false;

    public images = {
        front: null,
        reverse: null,
    };

    public salesmanList: any[] = [];

    public ossPath: string;

    public params: any = {};

    public phone: string;

    public is_quarterage = true;

    public buttons = [
        { name: 'create', click: () => this.addModel() },
        { label: '导出', display: true, click: () => this.exportData() },
    ];

    public form: nyForm;

    public adjournForm: nyForm;

    public semList: Array<any> = [];

    public extensionModalVisible = false;

    public uplodeType = ['front', 'reverse'];

    public memberId: number;

    // 转校
    public uesrInfo: any = {};

    public schoolList: any;

    public semesterList: any;

    public changeShcoolModalVisible = false;

    public changeSchoolform:nyForm;

    // 
    isMealStatus: boolean = true;
    isDisabledMeal: boolean = false;
    // 是否禁用住宿选择
    isDisableQuarterage: boolean = false;

    constructor(
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
        private nzModalService: NzModalService,
        private route: ActivatedRoute,
        private classService: ClassService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
        this.route.queryParams.subscribe((params) => {
            if (params.id) {
                this.edit(params);
            }
        })
    }

    ngOnInit() {
        this.getSellList();
        this.getShcool();
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('student_name').click = (item) => this.edit(item);
        }
        console.log(this.collection);
        
    }

    public signDetail: any;

    // 详情，编辑
    public edit(item: any) {
        this.signDetail = item;
        this.isVisible = true;
    }

    public close(callback) {
        this.isVisible = callback;
    }

    // 报到
    public signModalVisible = false;
    public dormList = [];
    public dormId: any;

    signModalCancel() {
        this.signModalVisible = false;
        this.params = { dorm_id: null };
    }

    signModalOK() {
        let params = {
            id: this.dormId,
            dorm_id: this.params.dorm_id
        }
        this.http.post("school/teaching-school/student-semester/check-in", params).then(() => {
            this.notification.success("提示信息", "报到成功");
            this.signModalCancel();
            this.collection.load();
        })
    }

    public checkin(item: any) {
		this.dormId = item.id;
		if (item.quarterage && item.is_quarterage == 1) {
			this.getDormList();
			this.signModalVisible = true;
		}else {
			this.nzModalService.confirm({
				nzTitle: '确认报道吗?',
				nzIconType: 'info-circle',
            	nzOnOk: () => {
					this.signModalOK();
				}
			})
		}
    }

    public getDormList() {
        this.http.get("school/teaching-school/school/get-dorm-list").then(ret => {
            this.dormList = ret || [];
        })
    }

    public reasonId: any;

    // 延期
    public extension(item: any) {
        this.extensionModalVisible = true;
        this.reasonId = item.id;
    }

    public adjournFormInit() {
        this.adjournForm.request = this.http.request.bind(this.http);
        this.adjournForm.onSubmit = body => {
            body.id = this.reasonId;
        }
    }

    // 延期 ，确定对话框
    public extensionModalOK() {
        this.adjournForm.action = 'school/teaching-school/student-semester/postpone';
        this.adjournForm.submit().then(res => {
            this.notification.success("提示信息", "延期成功");
            this.extensionModalCancel();
            this.collection.load();
        })
    }

    // 关闭延期对话框
    public extensionModalCancel() {
        this.extensionModalVisible = false;
        this.adjournForm.body = {};
    }

    // 转校
    public changeSchool(item) {
        this.uesrInfo = item;
        this.changeShcoolModalVisible = true;
    }

    public cancelChangeShcoolModal() {
        this.changeShcoolModalVisible = false;
        this.changeSchoolform.body = {};
        this.uesrInfo = {};
    }

    public changeShcoolModalOK() {
        this.changeSchoolform.action = 'school/teaching-school/transfer-school/create',
        this.changeSchoolform.submit().then(res => {
            this.notification.success('提示信息', '转学提交成功!');
            this.cancelChangeShcoolModal();
            this.collection.load();
        })
    }

    public onchangeSchoolForm(form) {
        this.changeSchoolform.request = this.http.request.bind(this.http);
        this.changeSchoolform.onSubmit = body => {
            body.student_semester_id = this.uesrInfo.id;
            body.student_id = this.uesrInfo.student_id;
        }
    }

    public formChange(event) {
        if (event.name == 'school_id') {
            this.getSemester(event.value);
            this.changeSchoolform.body.semester_id = null;
        }
        
    }

    private getShcool() {
        this.http.post('school/teaching/school/get-list').then(res => {
            this.schoolList = res;            
        })
    }

    private getSemester(schoolId) {
        const parmas = {
            number_used: true,
            status_in: '[0,1]',
            school_id: schoolId
        }
        this.http.get('school/teaching-school/school/get-semester-list', parmas).then(res => {
            this.semesterList = res;
        })
    }

    public cancelTransferSchool(item) {
        this.nzModalService.confirm({
            nzTitle: '确认要取消转学?',
            nzOnOk: async () => {
                try {
                    await this.http.post('school/teaching-school/transfer-school/cancel', { id: item.transfer_school_id });
                    this.notification.success('提示信息', '取消成功');
                    this.collection.load();
                } catch (error) {
                    console.log(error);
                }
            }
        })
    }

    public cancelRegister(item) {
        this.nzModalService.confirm({
            nzTitle: '确认要取消报名吗?',
            nzOnOk: async () => {
                try {
                    await this.http.post('school/teaching-school/student-semester/cancel-registered', { id: item.id });
                    this.notification.success('提示信息', '取消成功');
                    this.collection.load();
                } catch (error) {
                    console.log(error);
                }
            }
        })
    }

    /**********添加报名成员 Model*********/
    // 添加
    public addModel() {
        this.getSemList();
        this.form.body.gender = 1;
        this.isShow = true;
    }

    // 关闭
    public cancel() {
		this.isShow = false;
		this.is_quarterage = true;
        this.images = {
            front: null,
            reverse: null
        };
        this.form.body = {};
        this.form.clearError();
        this.params = {};
    }

    semesterChange() {
        let semester = this.semList.find(item => item.id == this.params.semester_id);
        if (semester && (semester.meal_status == -1 || !semester.meal_status)) { // 学期不供餐
            this.isDisabledMeal = true;
            this.isMealStatus = false;
        } else if (semester && semester.meal_status == 1) {
            this.isDisabledMeal = false;
            this.isMealStatus = true;
        }

        if (semester && semester.is_contain_quarterage == 1) { // 学期通过住宿
            this.isDisableQuarterage = false;
            this.is_quarterage = true;
        } else if (semester.is_contain_quarterage == -1 || semester.is_contain_quarterage === 0) {
            this.is_quarterage = false;
            this.isDisableQuarterage = true;
        }
    }

    public onFormInit(form) {
        this.form.request = this.http.request.bind(this.http);
        this.form.onSubmit = (body) => {
            if (this.images.front && this.images.reverse) {
                body.id_card_images = {
                    front: this.images.front,
                    reverse: this.images.reverse,
                }
			}
			this.is_quarterage? body.is_quarterage = 1 : body.is_quarterage = 0;
            
            if (this.isMealStatus) {
                body.is_meal_status = 1;
            } else {
                body.is_meal_status = -1;
            }

            if (this.params && this.params.semester_id) {
                body.semester_id = this.params.semester_id;
            }

            body.action = 1;
            if (this.memberId) {
                body.id = this.memberId;
            }
        }
    }

    public save() {
        if ((this.images.front && !this.images.reverse) || (!this.images.front && this.images.reverse)) {
            this.notification.success("提示信息", "请上传完整的身份证图片!");
            return;
        }
        this.form.action = "school/teaching-school/student-semester/register";
        this.form.submit().then(() => {
            this.notification.success("提示信息", "创建成功");
            this.collection.load();
            this.cancel();
        })
    }

    public getSemList() {
        const params = {
            number_used: true,
            register_date: true,
            status_in: "0,1",
        }
        this.http.get("school/teaching-school/school/get-semester-list", params).then(ret => {
            this.semList = ret || [];
        })
    }

    // 手机号搜索
    public optionChange(value: string): void {
        if (value.trim().toString().length == 11) {
            this.form.clearError();
            this.getIphoneList(value);
        }
    }

    public getSellList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            this.salesmanList = ret || [];
        });
    }

    public getIphoneList(value: string) {
        let params: any = {
            mobile: value,
            is_err: false, //是否弹出错误框
        };
        this.http.post("member/member/find-user", params).then(ret => {
            if (ret) {
                this.form.body = ret; // 自动填充
                this.memberId = ret.id;
                if (ret.id_card_images) {
                    this.images.front = ret.id_card_images.front;
                    this.images.reverse = ret.id_card_images.reverse;
                }
            } else {
                this.memberId = null;
                this.form.body = { contact: value, gender: 1 };
                this.images = { front: null, reverse: null };
            }
        })
    }

    public frontLoad = false;

    public reverseLoad = false;

    /*正面上传*/
    public frontUploadImg = (item) => {
        this.publicUploadImg(item, 'front');
    }

    /* 反面上传*/
    public reverseUploadImg = (item) => {
        this.publicUploadImg(item, 'reverse')
    }

    /**
     * 图片上传
     * @param item
     * @param type
     */
    private publicUploadImg = (item, type) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        if (type == 'front') {
            this.frontLoad = true;
        } else {
            this.reverseLoad = true;
        }

        return new Observable((observer) => {
            this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
                if (type == 'front') {
                    this.images.front = urls[0];
                } else if (type == 'reverse') {
                    this.images.reverse = urls[0];
                }
                observer.next();
            }).catch(() => {
                this.frontLoad = false, this.reverseLoad = false
            })
        }).subscribe(() => {
            this.frontLoad = false;
            this.reverseLoad = false;
            item.onSuccess();
        })

    };

    public removeFile(type: string) {
        if (type == 'front') {
            this.images.front = null;
        } else if (type == 'reverse') {
            this.images.reverse = null
        }
    }
    isExport: boolean = false;
    exportData() {
        if (this.isExport) return ;
        this.isExport = true;

        let status = this.collection.headers.filter(item => item.field == "status");
        let statusList = [];
        let statusMap = {};
        if (status && status.length) {
            statusList = status[0].map;
        }
        if (statusList.length) {
            statusList.forEach(item => {
                statusMap[item.value] = item.label;
            });
            statusList = [];
        }
        let tradeTypeMap = {};
        let tradeType = this.collection.headers.filter(item => item.field == "trade_type");
        if (tradeType && tradeType.length) {
            (tradeType[0].map || []).forEach(item => {
                tradeTypeMap[item.value] = item.label;
            });
        }

        console.log(tradeTypeMap, tradeType);
        

        
        let tableHeaders = [
            // 基础信息
            { label: "序号", key: "index", },
            { label: "姓名", key: "student_name", },
            { label: "联系方式", key: "student_mobile", },
            { label: "身份证号码", key: "id_card", },
            { label: "报名校区", key: "school_name", },
            { label: "报名学期", key: "semester_name", },
            { label: "报道状态", key: "status", },
            { label: "学期原价（定金+剩余学费）", key: "semester_money", },
            { label: "是否住宿", key: "is_quarterage", },
            { label: "是否供餐", key: "is_meal_status", },
            { label: "报名备注", key: "remark", },
            // 定金收款
            { label: "付款定金", key: "earnest_info", subKey: "total" },
            { label: "支付方式", key: "earnest_info", subKey: "channel" },
            { label: "付款时间", key: "earnest_info", subKey: "updated_at" },
            { label: "付款备注", key: "earnest_info", subKey: "remark" },
            // 剩余学费收款
            { label: "支付学费（不包含定金）", key: "tuition_info", subKey: "total", },
            { label: "支付方式", key: "tuition_info", subKey: "channel", },
            { label: "付款时间", key: "tuition_info", subKey: "updated_at",  },
            { label: "付款备注", key: "tuition_info", subKey: "remark",  },
            // 押金
            { label: "押金", key: "deposit_info", subKey: "total" },
            { label: "支付方式", key: "deposit_info", subKey: "channel" },
            { label: "付款时间", key: "deposit_info", subKey: "updated_at" },
            { label: "付款备注", key: "deposit_info", subKey: "remark" },
            // 总计
            { label: "总付款金额", key: "total_price_paid", },
            { label: "计入提成", key: "push_money", },
            { label: "负责人", key: "principal_name", },
            { label: "销售", key: "salesman_name", },
            { label: "成单类型", key: "trade_type", },
        ];

        let headers = tableHeaders.map(item => item.label);
        let table = [];
        table.push(headers);
        let merges = [
            {
                s: {c: 0, r: 0,},
                e: {c: 10, r: 0,}
            },
            {
                s: {c: 11, r: 0,},
                e: {c: 14, r: 0,}
            },
            {
                s: {c: 15, r: 0,},
                e: {c: 18, r: 0,}
            },
            {
                s: {c: 19, r: 0,},
                e: {c: 22, r: 0,}
            },
            {
                s: {c: 23, r: 0,},
                e: {c: 27, r: 0,}
            }
        ];
        let tableInfo = [];
        tableHeaders.forEach((item, index) => {
            if (index <= 10) {
                tableInfo.push("基础信息");
            } else if (index <= 14) {
                tableInfo.push("定金收款");
            } else if (index <= 18) {
                tableInfo.push("剩余学费收款");
            } else if (index <= 22) {
                tableInfo.push("押金");
            } else {
                tableInfo.push("总计");
            }
        });
        table.unshift(tableInfo);

        let params = {
            action: "query",
            // size: this.collection.size,
            // page: 1,
            params: this.collection.params,
            fields: ["student.name|student_name", "student.mobile|student_mobile", "semester.name|semester_name", "class.name|class_name",
            "dorm.name|dorm_name", "status", "tuition", "is_quarterage", "quarterage", "earnest_paid", "deposit_paid", "trade_type",
            ],
        }
        let school = this.classService.getCurrentSchool();
        this.http.post('school/teaching-school/student-semester/list?coach_id=' + school.id, params).then(ret => {
            (ret || []).forEach((item, index) => {
                let rowData = [];
                tableHeaders.forEach((data) => {
                    if (data.key == "index") {
                        rowData.push(index + 1);
                    } else if (data.key == "status") {
                        rowData.push(statusMap[item[data.key]]);
                    } else if (data.key == "trade_type") {
                        rowData.push(tradeTypeMap[item[data.key]]);
                    } else if (data.key == "is_quarterage" || data.key == "is_meal_status") {
                        rowData.push(item[data.key] == 1 ? "是" : "否");
                    } else if (data.subKey) {
                        if (item[data.key]) {
                            rowData.push(item[data.key][data.subKey] || "");
                        } else {
                            if (data.subKey == "total") {
                                rowData.push("0");
                            } else {
                                rowData.push("");
                            }
                        }
                    } else {
                        // 付款金额和计入提成 默认为0
                        if (data.key == "total_price_paid" || data.key == "push_money") {
                            rowData.push(item[data.key] || "0");
                        } else {
                            rowData.push(item[data.key] || "");
                        }
                    }
                })
                table.push(rowData);
            });
            
            let e = new Export('学员报名');
            let data = {
                // title: '学员报名',
                table: table,
                merges: merges,
            };
            
            e.write(data);
            this.isExport = false;

        }).catch(() => this.isExport = false);
        
    }
}
