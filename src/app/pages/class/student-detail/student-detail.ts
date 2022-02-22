import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Http } from "@yilu-tech/ny/index";
import { FileService } from "@/providers/file-service";
import { NzNotificationService } from "ng-zorro-antd";
import { Config } from "@/config";

@Component({
    selector: 'student-detail',
    templateUrl: './student-detail.html',
    styleUrls: ['./student-detail.scss']
})
export class StudentDetail implements OnInit {
    @Input() detailVisible: boolean;

    @Input() detailData: any;

    @Output() visibleChange: EventEmitter<any> = new EventEmitter();

    public ossPath: string;

    constructor(
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    ngOnInit() {
        this.getList();
		this.getDetailData();
        this.getClique();
    }

    collection: any = {};

    public infoForm: nyForm;

    public params: any = {};

    public faction;

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
	
	public provinceList = [];

    public cityList = [];

    public areaList = [];

    public getDetailData() {
        this.http.get('school/teaching-class/student/detail', { id: this.detailData.student_id }).then(res => {
            this.params = res;
            if (this.params.province_id) {
                this.getList( this.params.province_id,'province');
            }
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

    public cancel() {
        this.visibleChange.emit(false);
    }

    public async getClique() {
        const result = await this.http.post('school/teaching/clique/get-list');
        this.faction = result;
    }

}
