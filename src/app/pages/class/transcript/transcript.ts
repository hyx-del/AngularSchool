import { Component, OnInit } from '@angular/core';
import { Http } from "@yilu-tech/ny"
import { NzModalService, NzNotificationService } from "ng-zorro-antd"

@Component({
    selector: 'app-report-card',
    templateUrl: './transcript.html',
    styleUrls: ['./transcript.scss']
})
export class Transcript implements OnInit {
    public collection: any = {};

    public inputGradeVisible = false;

    public buttons = [
        { label: '成绩审核', isAddNewBtn: true, click: () => this.audit() }
    ];

    public scoreItem = [];

    public student_id = null;

    public student_name = null;

    constructor(
        private http: Http,
        private modalService: NzModalService,
        private notificationService: NzNotificationService,
    ) {
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.showCheckbox = true;
    }

    public audit(data?) {
		let params = {
			student_ids: []
		}
		if (data) {
			params.student_ids = [data.student_id];
		}else {
			if (!this.collection.checkedItems.length) {
				this.notificationService.info('提示信息', '请选择需要审核的学员!');
				return ;
			};

			params.student_ids = this.collection.checkedItems.map(item => item.student_id);
		}

        this.modalService.confirm({
            nzTitle: '确定要审核',
            nzOnOk: () => {
                this.http.post('school/teaching-class/class/batch-audit', params).then(res => {
                    this.notificationService.success('提示信息', '审核成功!');
                    this.collection.load();
                });
            }
        })


    }

    public save() {
        let params = {
            student_id: this.student_id,
            scores: []
        }

        this.scoreItem.forEach(item => {
            params.scores.push({ course_id: item.course_id, score: item.score });
        })

        this.http.post('school/teaching-class/achievement/input', params).then(res => {
            this.notificationService.success('提示信息', '录入成功!');
            this.inputGradeVisible = false;
            this.collection.load();
        });
    }

    public inputTranscript(item) {
        this.student_id = item.id;
        this.student_name = item.name;
        this.http.post('school/teaching-class/achievement/detail', { student_id: item.id }).then(res => {
            this.scoreItem = res;
        });

        this.inputGradeVisible = true;
    }

    public close() {
        this.inputGradeVisible = false;
    }
}
