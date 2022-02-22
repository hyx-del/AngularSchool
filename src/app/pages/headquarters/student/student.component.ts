import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Http } from "@yilu-tech/ny";
import { FileService, ClassService } from "@/providers/index";
import { NzNotificationService, NzTabChangeEvent } from "ng-zorro-antd";
import { Config } from "@/config";
import { Subject } from "rxjs";
import { debounceTime } from "rxjs/operators";
import * as dayjs from "dayjs";

@Component({
  selector: "app-student",
  templateUrl: "./student.component.html",
  styleUrls: ["./student.component.scss"],
})
export class StudentComponent implements OnInit {
  collection: any = {};
  FollowUp: any = {};
  record: any = {};
  public ossPath: string;
  salesmanList: any[] = [];
  public selectedIndex: Number = 0;
  public buttons = [{ name: "create", click: () => this.addStudent() }];
  addStudentVisible: boolean = false;
  form: nyForm;

  public sexValue = 1;

  sourceChannelList: any[] = [];
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
  // study_intention_status

  constructor(private http: Http, private fileService: FileService, private notification: NzNotificationService, private classService: ClassService, private cdr: ChangeDetectorRef) {
    this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
      this.ossPath = path;
    });
  }

  ngOnInit() {
    this.searchChange$
      .asObservable()
      .pipe(debounceTime(500))
      .subscribe((value) => {
        this.pageIndex = 1;
        this.getAllMember(value, true);
      });
    this.getList();
    this.getClique();
    if (!this.schoolList.length) {
      this.schoolList = this.classService.getSchoolList();
    }
    this.getSourceChannelList();
  }

  getSalesmanList() {
    this.http.get("staff/manage/getTrainingSalesmanList").then((ret) => {
      this.salesmanList = ret || [];
    });
  }

  // 来源渠道
  getSourceChannelList() {
    let params: any = {
      action: "query",
      params: [],
      fields: ["id", "name"],
      orderBy: "default_source asc",
    };
    this.http.post("hall/member/common/source/list", params).then((ret) => {
      this.sourceChannelList = ret || [];
    });
  }
  //全部学员
  setCollection(collection) {
    this.collection = collection;
    collection.onSetHeader = () => {
      this.collection.onLoad = (params) => {
        params.action = "queryFollow";
      };
      //   console.log("headers", this.collection.headers);
      if (this.collection.headers) {
        this.collection.headers.forEach((header) => {
          if (header.field == "created_at" || header.field == "recordTime") {
            header.minWidth = "180px";
          } else if (header.field == "opear") {
            header.minWidth = "120px";
          } else {
            header.minWidth = "100px";
          }
        });
      }
      collection.getHeader("name").click = (item) => this.details(item);
      collection.getHeader("opear").click = (item) => this.changefollowUpAll(item);
    };
  }
  //跟进列表
  setFollowUp(collection) {
    this.FollowUp = collection;
    collection.onSetHeader = () => {
      //   console.log("headers", this.collection.headers);
      this.FollowUp.onLoad = (params) => {
        params.resources_type = "saled";
        params.action = "queryFollow";
      };
      if (this.FollowUp.headers) {
        this.FollowUp.headers.forEach((header) => {
          if (header.field == "created_at" || header.field == "recordTime") {
            header.minWidth = "180px";
          } else if (header.field == "opear") {
            header.minWidth = "60px";
          } else {
            header.minWidth = "100px";
          }
        });
      }
      collection.getHeader("name").click = (item) => this.details(item);
      collection.getHeader("opear").click = (item) => this.changefollowUp(item);
    };
  }
  //查看跟进记录跳转
  public changefollowUpAll(item) {
    //v-if 加载
    this.tabsInit[3] = true;
    //默认选项卡
    this.selectedIndex = 3;
    this.details(item);
  }
  setRecord(collection) {
    this.record = collection;
    collection.onSetHeader = () => {
      // collection.getHeader('name').click = (item) => this.details(item);
    };
  }
  //查看跟进
  async changefollowUp(item) {
    this.details(item).then((res) => {
      if (this.params.province_id) {
        this.getList(this.params.province_id, "province").then((res) => {
          this.showFollowLog();
        });
      } else {
        this.showFollowLog();
      }
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

    this.getDetailInitData();
  }

  public onFormInit() {
    this.form.request = this.http.request.bind(this.http);
    this.form.onSubmit = (body) => {
      if (this.picture) {
        body.avatar = this.picture;
      }
      body.gender = this.sexValue;
      if (this.params) {
        body.province_id = this.params.province_id;
        body.city_id = this.params.city_id;
        body.area_id = this.params.area_id;
        body.avatar=this.params.avatar
      }
      if (!body.wechat_id) {
        delete body.wechat_id;
      }
      if (!body.mobile) {
        delete body.mobile;
      }

      // body.id_card = "320405198310019319";
    };
  }
  onFormChange(event: any) {
    if (event.name == "source_ids") {
      let sourceIds = event.value || [];
      this.setSourceStatus(sourceIds);
    }
  }
  //添加新学员
  saveAddMember() {
    if (!this.params.province_id && !this.params.city_id && !this.params.area_id) {
      this.notification.info("提示信息", "请选择完整的地址!");
      return;
    }
    this.form.body.avatar = this.params.avatar;
    this.form.action = "school/teaching/student/create";
    this.form.submit().then((res) => {
      this.notification.success("提示信息", "创建成功");
      this.cancelMemberEditor();
      this.collection.load();
    });
  }

  public cancelMemberEditor() {
    this.addStudentVisible = false;
    this.form.body = {};
    this.params = {};
    this.picture = null;
    this.form.clearError();
    this.setSourceStatus([]);
  }

  /**********************************详情************************************/
  public detailsVisible: boolean;

  public detailForm: nyForm;

  public data = [];

  public statusData = [
    { label: "潜在", value: 10 },
    { label: "学员", value: 20 },
    { label: "毕业", value: 30 },
  ];

  public registerGradeData = [
    { label: "无", value: 0 },
    { label: "普通", value: 10 },
    { label: "高级", value: 20 },
  ];

  public faction;

  public uploadLoading = false;

  public picture: string;

  public provinceList = [];

  public cityList = [];

  public areaList = [];

  public params: any = {};

  public registerGenre = [];

  detailSourceIsStaff: boolean = false;
  // 详情来源渠道为转介绍
  detailSourceIsSales: boolean = false;
  detailSourceIsOther: boolean = false;

  // 意向学习时间
  detailExpectedTime: Array<any> = [];

  public async details(data: any) {
    this.params = Object.assign({}, { id: data.id });
    this.detailsVisible = true;
    let result: any = await this.http.get("school/teaching/student/detail", { id: data.id });
    if (result["student_info"]) {
      // result['additional_data'] = result['student_info']['additional_data'];
      // result['consult_school_ids'] = result['student_info']['consult_school_ids'];
      if (!result["student_info"]["additional_data"]) {
        result["student_info"]["additional_data"] = {};
      }
      delete result["student_info"]["created_at"];
      result["student_info"]["lastLogUpdateTime"] = result["student_info"]["updated_at"];
      delete result["student_info"]["updated_at"];
      Object.assign(result, result.student_info);
    }

    if (result.expected_start_time && result.expected_end_time) {
      this.detailExpectedTime = [result.expected_start_time, result.expected_end_time];
    } else {
      this.detailExpectedTime = [];
    }
    this.setDetailSourceStatus(result.source_ids || []);

    this.detailForm.body = result;
    let genre;
    if (result.genre_value && result.genre_value.length) {
      genre = result.genre_value.filter((item) => item !== 0);
    }
    this.picture = result.avatar;
    this.registerGenre = genre;
    this.params = Object.assign({}, result);
    this.getDetailInitData();

    if (!this.salesmanList.length) {
      this.getSalesmanList();
    }
    if (!this.sourceChannelList.length) {
      this.getSourceChannelList();
    }
    if (!this.referrerMember.length) {
      this.getAllMember();
    }

    if (this.params.province_id) {
      this.getList(this.params.province_id, "province");
    }
  }

  //选项卡
  tabsInit: any = [];
  tabChange(event: NzTabChangeEvent) {
    if (!this.tabsInit[event.index]) {
      this.tabsInit[event.index] = true;
    }
  }
  public saveMember() {
    if (!this.params.province_id && !this.params.city_id && !this.params.area_id) {
      this.notification.info("提示信息", "请选择完整的地址!");
      return;
    }

    this.detailForm.action = "school/teaching/student/update";
    this.detailForm.submit().then((res) => {
      this.notification.success("提示信息", "修改成功");
      this.collection.load();
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
      if (this.registerGenre && this.registerGenre.length) {
        body.genre = this.registerGenre || [];
      }
      if (!body.wechat_id) {
        delete body.wechat_id;
      }
      if (!body.mobile) {
        delete body.mobile;
      }
    };
  }

  onDetailFormChange(event) {
    if (event.name == "source_ids") {
      let sourceIds = event.value || [];
      this.setDetailSourceStatus(sourceIds);
    }
  }

  setDetailSourceStatus(sourceIds) {
    let currentSourceChannel = this.sourceChannelList.filter((item) => sourceIds.indexOf(item.id) != -1);
    let channelNames = currentSourceChannel.map((item) => item.name);

    if (sourceIds && sourceIds.length) {
      this.detailSourceIsStaff = channelNames.indexOf("员工家属") != -1;
      this.detailSourceIsSales = channelNames.indexOf("转介绍") != -1;
      this.detailSourceIsOther = channelNames.indexOf("其他") != -1;
    } else {
      this.detailSourceIsStaff = false;
      this.detailSourceIsSales = false;
      this.detailSourceIsOther = false;
    }
    // this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  cancel() {
    this.detailsVisible = false;
    this.detailForm.body = {};
    this.picture = null;
    this.params = {};
    this.registerGenre = [];
  }

  public async getClique() {
    const result = await this.http.post("school/teaching/clique/get-list");
    this.faction = result;
  }

  //上传图片
  public uploadImgComplete(data: any, type: "add" | "update" = "add") {
    if (type == "add") {
      this.params.avatar = data.path;
    } else {
      this.picture = data.path;
    }
  }

  // 获取省市区
  public async getList(id?, type?) {
    let params: any = {};
    if (id) {
      params.id = id;
    }
    this.http.post("school/teaching/school/address-select", params).then((res) => {
      switch (type) {
        case "province":
          this.cityList = res;
          this.params.city_id = res[0].id;
          this.getList(this.params.city_id, "city");
          break;
        case "city":
          this.areaList = res;
          this.params.area_id = res[0].id;
          break;
        default:
          this.provinceList = res;
      }
    });
  }

  public onChange(val, type) {
    this.getList(val, type);
  }

  // 报名记录
  applyCollection: any = {};
  previewVisible: boolean = false;
  previewImageUrl: string = "";
  setApplyCollection(collection) {
    this.applyCollection = collection;
  }

  showPreviewImages(item) {
    this.previewImageUrl = item.certificate;
    this.previewVisible = true;
  }

  closeModal() {
    this.previewVisible = false;
  }

  // show(){
  //   this.recordAddIsVisible = true;
  // }
  //
  // recordAddHandleCancel(){
  //   this.recordAddIsVisible = false;
  // }

  // recordAddHandleOk(){
  //
  // }

  // 销售修改记录
  salesmanCollection: any = {};
  setSalesmanCollection(collection) {
    this.salesmanCollection = collection;
  }

  // 线索记录
  introduceCollection: any = {};
  setIntroduceCollection(collection) {
    this.introduceCollection = collection;
  }

  // 跟进记录
  followContent: string = "";
  logVisible: boolean = false;
  followButtons: any = [{ name: "", click: () => this.showFollowLog() }];
  followButtonss: any = [{ name: "create", click: () => this.showFollowLog() }];
  followCollection: any = {};
  logParams: any = {};
  logForm: nyForm;
  goalList: any[] = [];
  communicateList: any[] = [];
  studentPostionList: any[] = [];
  resourceList: any[] = [];
  schoolList: any[] = [];
  consultingCourseList: any[] = [];

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
        this.followCollection.headers.forEach((header) => {
          if (header.field == "created_at") {
            header.minWidth = "180px";
          } else {
            header.minWidth = "100px";
          }
        });
      }
    };
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

  // 学习目的
  getGoalList() {
    this.http.post("school/teaching/goal/get-list").then((ret) => {
      this.goalList = ret || [];
    });
  }

  // 获取咨询课程
  getConsultingCourseList() {
    this.http.post("school/teaching/consulting-course/get-list").then((ret) => {
      this.consultingCourseList = ret || [];
    });
  }

  // 沟通方式
  getCommunicate() {
    this.http.post("school/teaching/communicate/get-list").then((ret) => {
      this.communicateList = ret || [];
    });
  }

  // 学员身份
  getStudentPosition() {
    this.http.post("school/teaching/position/get-list").then((ret) => {
      this.studentPostionList = ret || [];
    });
  }

  // 资源类型
  getResourceList() {
    this.http.post("school/teaching/resource/get-list").then((ret) => {
      this.resourceList = ret || [];
    });
  }

  logFormInit() {
    this.logForm.request = this.http.request.bind(this.http);
    this.logForm.action = "school/teaching/student/follow-create";
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
    };
  }

  logFormChange(event: any) {
    if (event.name == "source_ids") {
      let sourceIds = event.value || [];
      this.setSourceStatus(sourceIds);
    }
  }

  setSourceStatus(sourceIds: any[]) {
    let currentSourceChannel = this.sourceChannelList.filter((item) => sourceIds.indexOf(item.id) != -1);
    let channelNames = currentSourceChannel.map((item) => item.name);

    if (sourceIds && sourceIds.length) {
      this.sourceIsStaff = channelNames.indexOf("员工家属") != -1;
      this.sourceIsSales = channelNames.indexOf("转介绍") != -1;
      this.sourceIsOther = channelNames.indexOf("其他") != -1;
    } else {
      this.sourceIsStaff = false;
      this.sourceIsSales = false;
      this.sourceIsOther = false;
    }
    // this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  createFollowLog() {
    this.logForm.submit().then(() => {
      this.notification.success("提示信息", "创建成功");
      this.cancelLog();
      this.followCollection.load();
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
    let sourceIds = this.logParams.source_ids || [];
    this.setSourceStatus(sourceIds);
    this.setFollowLogDisabled();
  }

  // 添加跟进记录 来源渠道和咨询校区 不能删除 只能修改
  setFollowLogDisabled(isReset: boolean = false) {
    let schoolIds = this.logParams.consult_school_ids || [];
    let sourceIds = this.logParams.source_ids || [];

    if (sourceIds.length) {
      this.sourceChannelList.forEach((item) => {
        if (isReset) {
          item.disabled = false;
        } else if (sourceIds.indexOf(item.id) != -1) {
          item.disabled = true;
        }
      });
    }
    this.schoolList.forEach((item) => {
      if (schoolIds.indexOf(item.id) != -1) {
        if (isReset) {
          item.disabled = false;
        } else {
          item.disabled = true;
        }
      }
    });
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

  private getAllMember(keyword: string = "", isSearch: boolean = false) {
    let params: any = {
      page: this.pageIndex,
      // size: 100,
    };
    if (keyword) {
      params.keyword = keyword;
    }

    this.http.get("member/common/member/member-list", params).then((ret) => {
      (ret.data || []).forEach((item) => {
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
    });
  }
}
