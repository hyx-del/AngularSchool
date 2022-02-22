import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-dormitory',
    templateUrl: './dormitory.component.html',
    styleUrls: ['./dormitory.component.scss']
})
export class DormitoryComponent implements OnInit {
    public collection: any = {};

    public isVisible: boolean = false;

    public params: any = {};

    public form: nyForm;

    public buttons = [
        { name: 'create', click: () => this.addDorm() }
	];

	public allocationButton = [
		{ label: '批量添加', isAddNewBtn: true, click: () => this.addStudent(), nzType: 'primary' }
	]

    public detailData: any = {
		students: [],
	};

	public detailVisible = false;
	
	public studentList: any;

	public allocationUrl: string;

    public dormId: any; //宿舍 id

    constructor(
        private http: Http,
        private notification: NzNotificationService,
        private modalService: NzModalService,
    ) {
    }

    ngOnInit() {
    }

    setCollection(collection) {
        this.collection = collection;
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.dormdetail(item);
        }
	}
	
	studentCollection(collection) {
		this.studentList = collection;
		this.studentList.showCheckbox = true;
	}

	// 启用
    public enable(item) {
        this.modalService.confirm({
            nzTitle: "确定启用这个教室",
            nzOnOk: () => {
                this.http.post("school/teaching-school/dorm/enable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "启用成功");
                    this.collection.load();
                })
            }
        })
    }

	// 禁用
    public disabled(item) {
        this.modalService.confirm({
            nzTitle: "确定禁用这个宿舍",
            nzOnOk: () => {
                this.http.post("school/teaching-school/dorm/disable", { id: item.id }).then(() => {
                    this.notification.success("提示信息", "禁用成功");
                    this.collection.load();
                })
            }
        })
    }

	// 删除
    public removeDorm(item) {
        let params = {
            is_used: item.is_used,
            school_id: item.school_id,
            id: item.id
        };
        this.modalService.confirm({
            nzTitle: "确定删除这个宿舍",
            nzOnOk: () => {
                this.http.post("school/teaching-school/dorm/delete", params).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collection.load();
                })
            }
        })
	}
	
	/**添加、修改 */
    public addDorm() {
        this.isVisible = true;
        this.form.body.max_number = 1;
	}
	
	private dormdetail(item) {
		this.isVisible = true;
		this.form.body.max_number = 1;
		this.http.get("school/teaching-school/dorm/detail", { id: item.id }).then(ret => {
			this.form.body = ret;
			this.params = ret;
		});
	}

    public onFormInit(form) {
		this.form.request = this.http.request.bind(this.http);
		this.form.onSubmit = body => {
			if (this.params.id) {
				body.id = this.params.id;
			}
		}
    }

    public handleOk() {
		if(this.params.id) {
			this.form.action = 'school/teaching-school/dorm/update';
		}else {
			this.form.action = "school/teaching-school/dorm/create";
		}
       
        this.form.submit().then(() => {
			if (this.params.id) {
				this.notification.success("提示信息", "修改成功");
			}else {
				this.notification.success("提示信息", "创建成功");
			}
            
            this.handleCancel();
            this.collection.load();
        })
    }

    public handleCancel() {
        this.isVisible = false;
        this.form.body = {};
        this.params = {};
        this.form.clearError();
	}
	
	/**详情 */
    private detailList(id) {
        this.detailVisible = true;
        this.dormId = id
        this.http.get("school/teaching-school/dorm/detail", { id: id }).then(ret => {
			this.detailData = ret;
		});
		
		this.allocationUrl = 'school/teaching-school/student-semester/check-in-list'
    }

    public close() {
        this.detailVisible = false;
    }

    public memberRemove(data: any) {
        this.modalService.confirm({
            nzTitle: "确定删除这个成员",
            nzOnOk: () => {
                this.http.post("school/teaching-school/dorm/delete-student", {
                    student_id: data.student_id,
                    id: this.detailData.id
                }).then(ret => {
					this.notification.success("提示信息", "删除成功");
					this.studentList.load();
                    this.detailList(this.dormId);
                })
            }
        })
    }

    public addStudent(item?: any) {
		let student_ids = []
		if (!item) {
			if (!this.studentList.checkedItems.length) {
				this.notification.info('提示信息', '请选择学员！');
				return;
			}
			student_ids  =	this.studentList.checkedItems.map(item => item.student_id)
		}else {
			student_ids = [item.student_id];
		}
		
		
        let params: any = {
			id: this.dormId,
			student_ids: student_ids,
		}

        this.modalService.confirm({
            nzTitle: "确定添加宿舍成员",
            nzOnOk: () => {
                this.http.post("school/teaching-school/dorm/distribute", params).then(() => {
                    this.notification.success("提示信息", "添加成功");
                    this.detailList(this.dormId);
                    this.studentList.load();
                })
            }
        })
    }

}
