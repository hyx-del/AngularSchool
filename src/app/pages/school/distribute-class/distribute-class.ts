import { Component, OnInit } from '@angular/core';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-distribute-class',
    templateUrl: './distribute-class.html',
    styleUrls: ['./distribute-class.scss']
})
export class DistributeClass implements OnInit {
    collection: any = {};
    collectionClass: any = {};
    isVisible: boolean = false;
    isShow = false;
    addMemberShow: boolean = false;
    ossPath: string;
    classList: any[] = [];
    params: any = {};
    form: nyForm;
    public buttonClass: any[] = [
        { name: 'create', label: "添加", click: () => this.showClassModal(), },
        { label: '批量删除', isAddNewBtn: true, click: () => this.batchDelete() }
    ];
    public addStudentUrl: string;

    public colorArr = ["#3388FF", "#F5815D", "#5BD171", "#FFBF00", "#FC81DB", "#728ba8", "#B264EA", "#3bccdf"];

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
        this.collection.onLoaded = () => {
            this.classList = this.collection.data || [];

            let index = 0;
            let map = new Map();

            this.classList.forEach(item => {
                item.text = item.name.substring(0, 1);
                if (map.get(item.semester_id)) {
                    item.color = map.get(item.semester_id);
                } else {
                    if (index > this.colorArr.length - 1) {
                        index = 0;
                    }
                    map.set(item.semester_id, this.colorArr[index]);
                    item.color = this.colorArr[index];
                    index++;
                }
            });
        }
    }

    showClassModal() {
        this.addStudentUrl = 'school/teaching-school/student-distribute/show-list?semester_id=' + this.detaillist.semester_id;
        this.addMemberShow = true;
        this.params = {};
    }

    public memberdetail: any[] = [];

    classCollection(collectionClass) {
        this.collectionClass = collectionClass;
        this.collectionClass.showCheckbox = true;
        this.collectionClass.onLoaded = () => {
            this.memberdetail = this.collectionClass.data || [];
        };
        //   collectionClass.onSetHeader = () => {
        //   collectionClass.getHeader('name').click = (item) => this.detail();
        // }
    }

    public batchDelete() {
        if (!this.collectionClass.checkedItems.length) {
            this.notification.info('提示信息', '请选择要删除的学员！');
            return;
        }

        const ids = this.collectionClass.checkedItems.map(item => item.id);
        this.remove(ids, true)
    }

    cancel() {
        this.isShow = false;
    }

    public remove(item, isbatchDelete = false) {
        this.modalService.confirm({
            nzTitle: "确定删除学员",
            nzOnOk: () => {
                this.http.post("school/teaching-school/student-distribute/remove", {
                    ids: isbatchDelete ? item : [item.id],
                    semester_id: this.detaillist.semester_id
                }).then(ret => {
                    this.notification.success("提示信息", "删除成功");
                    this.collectionClass.load();
                })
            }
        })
    }

    public detaillist: any = {};
    public detailListUrl: string;

    //班级详情
    public goToClassDetail(list) {
        this.detaillist = list;
        this.detailListUrl = 'school/teaching-school/student-distribute/list?class_id=' + list.id;
        this.isShow = true;
    }

    // 学员添加分班
    public classGroupList: any = {};

    public classGroupButton = [
        { label: '批量添加', isAddNewBtn: true, nzType: 'primary', click: () => this.addStudent() }
    ];

    public classGroupCollection(collection: any) {
        this.classGroupList = collection;
        this.classGroupList.showCheckbox = true;
    }

    public addStudent() {
        if (!this.classGroupList.checkedItems.length) {
            this.notification.info('提示信息', '请选择要分班的学生!');
            return;
        }
        const student_id = this.classGroupList.checkedItems.map(item => item.id);
        const params = {
            class_id: this.detaillist.id,
            student_id,
            semester_id: this.detaillist.semester_id,
        }

        this.modalService.confirm({
            nzTitle: '提示信息',
            nzContent: `${this.detaillist.coursePlanStatus == 1 ? '该班级已选择教室排课是否继续分班？' : '确定要将该学生进行分班操作？'}`,
            nzOnOk: async () => {
                try {
                    await this.http.post('school/teaching-school/student-distribute/distribute', params);
                    this.notification.success('提示信息', '分班成功!');
                } catch (error) {
                    this.errorModal(error.error.data)
                }

                this.classGroupList.load();
                this.collectionClass.load();
            }
        });
    }

    private errorModal(errorData: Array<any>) {
        let content = "";
        for (const key in errorData) {
            if (key == 'status') {
                continue;
            }
            
            content += `<div style="margin-bottom: 0;">${errorData[key]}</div>`;
        }

        this.modalService.warning({
            nzTitle: `提示信息`,
            nzContent: content,
            nzWidth: 520,
            nzCancelText: null,
        })
    }

    public handleCancel() {
        this.addMemberShow = false;
    }

}
