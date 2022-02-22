import { Injectable, EventEmitter } from '@angular/core';
import { Http, Cache, Auth } from '@yilu-tech/ny';

@Injectable({
    providedIn: 'root'
})
export class ClassService {

    public onChange: EventEmitter<any> = new EventEmitter<any>();
    public onLoaded: EventEmitter<any> = new EventEmitter<any>();

    public loaded: boolean;

    protected _schoolList: Array<any> = [];
    protected _semesterList: any;
    protected _classGradeList: Array<any> = [];

    protected _currentSchool: any;
    protected _currentSemester: any;
    protected _currentClassGrade: any;

    protected _loading: Promise<any>;

    constructor(
        private http: Http,
        private cache: Cache,
        private auth: Auth
    ) {
        this.refresh();
	}
	
	public resolve(group) {
		switch (group) {
			case 'teaching_school':
				let school = this.getCurrentSchool();
				return 'teaching_school:' + (school ? school.id : '');
			case 'teaching_class':
				let classGrade = this.getCurrentClassGrade();
				return 'teaching_class:' + (classGrade ? classGrade.id : '');
			default:
				return group;
		}
	}

    public do(callback: () => void): Promise<any> {
        return this._loading ? this._loading.then(callback) : Promise.resolve(callback());
    }

    public async prepared() {
        if (this._loading) {
            await this._loading;
        }
        return this;
    }


    /**
     *  获取的列表数据
     */
    private getAllData() {
        return this.http.post('school/teaching/school/get-list').then((ret) => {
            this._schoolList = ret;
            this._currentSchool = null;
            this._currentClassGrade = null;

			if (!this._schoolList.length) {
				return ;
			}
            const currentSchoolKey = this.cache.get('currentSchoolKey');
            for (const school of this._schoolList) {
                this._classGradeList = this._classGradeList.concat(school.classes);
                if (school.id == currentSchoolKey) {
                    this.setCurrentSchool(school, this.cache.get('currentClassGradelKey'))
                }
            }
            if (!this._currentSchool) {
                this.setCurrentSchool(ret[0]);
            }
            if (!this._currentClassGrade) {
                this.setCurrentClassGrade(this._currentSchool.classes[0]);
            }
        })
    }

    /**
     * 设置选中的学校
     * @param school 相关学校的数据
     * @param hallId // 学校的id
     */
    public setCurrentSchool(school: any, schoolId?: any) {
        if (this._currentSchool) {
            this._currentSchool.checked = false; //先都设为没有选中
        }

		this._currentSchool = school;		
        if (this._currentSchool) {
            this._currentSchool.checked = true;
        }
        this._classGradeList = this.getSchoolHalls();

        this.cache.forever('currentSchoolKey', school ? school.id : '');
        this.onChange.emit({ school });
        this.setCurrentClassGrade(schoolId ? this._classGradeList.find(_ => _.id == schoolId) : this._classGradeList[0]);
    }

    public getSchoolHalls(data?: any) {
        data = data || this.getCurrentSchool();        
        return data ? data.classes : []
    }

    /**
     * 设置班级选中
     * @param semester
     */
    public setCurrentClassGrade(classGrade: any) {

        if (this._currentClassGrade) {
            this._currentClassGrade.checked = false;
        }
        this._currentClassGrade = classGrade;
        if (this._currentClassGrade) {
            this._currentClassGrade.checked = true;
        }

        this.cache.forever('currentClassGradelKey', classGrade ? classGrade.id : '');
        this.onChange.emit({ classGrade })
    }

    /**
     * 刷新数据
     */
    public refresh() {
        this.loaded = false;
        this._loading = this.check().then((bool) => {
            if (bool) {
                return this.getAllData();
            }

            this._classGradeList = this._schoolList = [];
            this._currentClassGrade = this._currentSchool = null;
            return null;
        }).then(() => {
            this._loading = null;
            this.loaded = true;
            this.onLoaded.emit()
        })
    }

    /**
     * 检查
     */
    private check() {
        let check = this.auth.check();
        if (typeof check === 'boolean') {
            return Promise.resolve(check);
        }
        return check;
    }


    /**
     * 返回学校数据
     */
    public getSchoolList() {        
        return this._schoolList;
    }


    /**
     * 返回学校选中的数据
     */
    public getCurrentSchool() {
        return this._currentSchool;
    }

    /**
     * 返回班级选中的数据
     */
    public getCurrentClassGrade() {
        return this._currentClassGrade;
    }

    /**
     * 返回班级数据
     */
    public getClassGradeList() {
        return this._classGradeList
    }
}
