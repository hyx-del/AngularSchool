import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Form } from '@/providers/form';
import { RoleManage, RoleService } from '@/providers/services/role.service'
import { Http, date, strtodate } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService } from '@/providers/index';
import { ImageCropperResult } from './../../shared/crop-image/crop-image';
import * as differenceInCalendarDays from 'date-fns/difference_in_calendar_days';
import * as dayjs from 'dayjs'

@Component({
    templateUrl: './staff-manage.html',
    styleUrls: ['./staff-manage.scss']
})
export class StaffManageComponent implements OnInit {
    @ViewChild('slider') slider: ElementRef;

    public group;

    public visible: boolean;

    public form: Form;

    public roles: number[] = [];

    public roleManage: RoleManage = new RoleManage();

    public collection: any = {};

    public isCreate: boolean;

    public isBinding: boolean;

    public isShowFormalInput = false;

    public buttons: any[] = [
        {
            name: 'create', click: () => {
                this.isShowPwd = false;
                this.isCreate = this.visible = true;
                this.form.setBody({ gender: 1, type: 1, });
            }
        },
        { label: '启用', click: () => this.enabledStaff(), hidden: true },
        { label: '禁用', click: () => this.disableStaff() },
    ];

    public staff: any;

    public functions: any[] = [
        // { label: '店长', value: 16, group: 'hall' },
        // { label: '教练', value: 2, group: 'teaching' },
        { label: '教练', value: 8, group: 'teaching' },
        { label: '销售', value: 32, group: 'teaching_school' },
    ];

    public confirm: any = {
        visible: false,
        content: '',
        onOk: null
    };

    public memberInfo = {
        visible: false,
        mobile: '',
        info: null,
        staff: null
    }

    public listUrl = 'staff/manage/list';

    public imgType = {
        headPhoto: 'headPhoto',
        showImg: 'showImg'
    }

    ossPath: string = "";
    avatar: string = "";

    isShowPwd: boolean = false;
    staffDescription: string = "";
    isUploadLoading: boolean = false;

    public positiveVisible = false;

    public today = new Date();

    public formDate: nyForm;

    public becomeFullMember: any;

    public isShowType = 1;

    public types;

    constructor(
        private notification: NzNotificationService,
        private http: Http,
        private roleService: RoleService,
        private fileService: FileService,
        private activeRoute: ActivatedRoute,
        private modalService: NzModalService,
    ) {
        this.activeRoute.data.subscribe((value) => {
            this.group = value.group || '';
            this.roleService.getRoles(this.group).then((manage) => {
				this.roleManage = manage;
				// this.listUrl = 'staff/manage/list' + this.getGroupQueryStr();
				// console.log(this.listUrl);
            });
            this.functions.forEach((item) => {
                // console.log(this.group)
                if(this.group==item.group){
                    item.disabled = false;
                } else{
                    item.disabled = (item.group != '' || this.group == 'teaching_class');
                }
            });
        });
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        });
    }

    ngOnInit() {
    }

    public setCollection(collection) {
        this.collection = collection;
        collection.onClick = (e) => {
            if (e.status < 0) {
                this.buttons[1].hidden = false;
                this.buttons[2].hidden = true;
            } else {
                this.buttons[1].hidden = true;
                this.buttons[2].hidden = false;
            }
        };
    }

    public formInit(form: Form) {
        this.form = form;
        form.onSubmit = (body) => {
            body.roles = this.roleManage.getChecked().map((item) => item.id);
            if (body.entry_time) {
                body.entry_time = date('Y-m-d', body.entry_time);
            }
            if (!this.isCreate || this.isBinding) {
                body.staff_id = this.staff.id;
            }
            body.description = this.staffDescription || "";

            // display_pgotos
            let display_photos = [];
            this.showImgList.forEach(item => {
                if (item.checked) {
                    display_photos.unshift(item.path);
                } else {
                    display_photos.push(item.path)
                }
            });
            body.display_photos = display_photos;

            if(!this.isShowFormalInput) {
                delete body.conversion_date;
            }else {
                body.conversion_date = dayjs(body.conversion_date).format("YYYY-MM-DD")
            }
        }
    }

    public roleChange(change) {
        if (!change.currentValue) {
            return;
        }
        this.roleManage.reset().items.forEach((item) => {
            if (change.currentValue.indexOf(item.id) > -1) {
                this.roleManage.check(item, true);
            }
        })
    }

    protected getGroupQueryStr() {
        let params = this.roleService.makeGroupParams(this.roleManage.group);
        let str = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
        return str ? '?' + str : '';
    }

    public submit() {
        let queryString = this.getGroupQueryStr();

        if (this.isBinding) {
            this.form.action = 'staff/manage/addrole' + queryString;
        } else if (this.isCreate) {
            this.form.action = 'staff/manage/create' + queryString;
        } else {
            this.form.action = 'staff/manage/update' + queryString;
        }
        this.form.submit().then((ret) => {
            this.visible = false;
            this.avatar = "";
            this.staffDescription = "";

            this.active = 0;
            this.showImgList = [];

            this.collection.load();
            this.unbind();

            this.isShowFormalInput = false;
        })
    }

    public resetPassword() {
        this.confirm.visible = true;
        this.confirm.content = '确认重置员工<' + this.staff.name + '>密码？';
        this.confirm.onOk = () => this.http.post('staff/manage/resetpassword', { staff_id: this.staff.id }).then(() => {
            this.notification.success('提示', '密码重置成功。');
        })
    }

    public cancel() {
        this.visible = false;
        this.roles = [];
        this.form.clearErrors();
        this.unbind();
        this.avatar = "";
        this.staffDescription = "";

        // 图片展示
        this.active = 0;
        this.showImgList = [];

        // 转正日期
        this.isShowFormalInput = false;
    }

    public edit(user) {
        this.isShowPwd = false;
        this.visible = true;
        this.isCreate = false;
        this.find(user.mobile)
    }

    public find(mobile?: string) {
        if (!mobile) {
            this.form.clearErrors();
            mobile = this.form.getValue('mobile');
        }
        if (!mobile) {
            return this.notification.info('提示', '手机号不能为空');
        }
        let params = Object.assign({ mobile }, this.roleService.makeGroupParams(this.roleManage.group));
        this.roleService.getGroup(this.group).then((group) => this.http.get('staff/info/findbymobile', params)).then((user) => {
            if (user) {
                user.roles = user.roles.map((item) => item.id);
                user.entry_time = strtodate(user.entry_time, 'Y-m-d');
                user.functions = this.functions.filter((item) => user.functions & item.value).map((item) => item.value);
                this.form.setBody(user);
                this.staff = user;
                if (user.avatar) {
                    this.avatar = user.avatar;
                }
                if (user.description) {
                    this.staffDescription = user.description;
                }
                this.isBinding = this.isCreate

                if (user.display_photos) {
                    let newData = [];
                    // this.isActiveImg = 0;
                    let obj = {}
                    user.display_photos.forEach((item, index) => {
                        if (index == 0) {
                            obj = {
                                path: item,
                                checked: true
                            }
                        } else {
                            obj = {
                                path: item,
                                checked: false
                            }
                        }

                        newData.push(obj)
                    })
                    this.showImgList = newData
                }

                if(user.type == 2){
                    this.isShowFormalInput = true;
                }

                if(user.type) {
                    this.isShowType = user.type;
                }

            } else {
                this.notification.info('提示', '员工不存在');
            }
        })
    }

    disableStaff() {
        if (!this.collection.currentItem) {
            this.notification.info("提示信息", "请选择需要禁用的员工");
            return;
        }
        this.http.post("staff/manage/disable", { staff_id: this.collection.currentItem.id }).then(ret => {
            this.notification.success("提示信息", "禁用成功");
            this.collection.load();
        })
    }

    enabledStaff() {
        if (!this.collection.currentItem) {
            this.notification.info("提示信息", "请选择需要启用的员工");
            return;
        }
        this.http.post("staff/manage/enable", { staff_id: this.collection.currentItem.id }).then(ret => {
            this.notification.success("提示信息", "启用成功");
            this.collection.load();
        })
    }

    changePwdShow() {
        this.isShowPwd = !this.isShowPwd;
    }

    public remove(item) {
        this.confirm.visible = true;
        this.confirm.content = `确认移除员工 ${item.name} ？`;
        this.confirm.onOk = () => this.http.post("staff/manage/emptyrole", { staff_id: item.id }).then(() => {
            this.notification.success("提示信息", "员工移除成功");
            this.collection.load();
        }).catch(() => {
            this.notification.error("提示信息", "员工移除失败");
        });
    }

    public unbind() {
        this.staff = null;
        this.isBinding = false;
        this.form.setBody()
    }

    public uploadImg = (item) => {
        let formData = new FormData();
        formData.set('images[]', item.file);

        const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
        if (!isLtMaxSize) {
            this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
            return;
        }
        this.isUploadLoading = true;

        this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
            this.avatar = urls[0];
            this.form.setValue("avatar", urls[0]);
            this.isUploadLoading = false;
        }).catch(() => {
            this.isUploadLoading = false;
        });
    };

    uploadImgComplete(data: ImageCropperResult) {
        this.avatar = data.path;
        this.form.setValue("avatar", data.path);
    }

    public reset() {
        this.memberInfo.info = null;
        this.memberInfo.mobile = '';
    }

    public bindMember(staff?: any) {
        if (staff) {
            this.memberInfo.staff = staff
            this.memberInfo.visible = true;
            if (staff.member_id) {
                this.findMember(staff.member_id);
            } else {
                this.memberInfo.info = null;
                this.memberInfo.mobile = '';
            }
        } else {
            this.http.post("staff/manage/bindmember", {
                staff_id: this.memberInfo.staff.id,
                member_id: this.memberInfo.info && this.memberInfo.info.id
            }).then((result) => {
                this.notification.success("提示信息", "会员绑定成功");
                this.collection.load();
                this.memberInfo.visible = false;
            }).catch((error) => {
                if (error.error && error.error.message) {
                    this.notification.error("提示信息", error.error.message);
                } else {
                    this.notification.error("提示信息", "会员绑定失败");
                }
            });
        }
    }

    public findMember(key?: any) {
        let url, params;
        if (key) {
            url = 'member/admin/member/detail';
            params = { member_id: key };
        } else {
            url = 'member/admin/userinfo-by-mobile';
            if (!this.memberInfo.mobile) {
                return;
            }
            params = { mobile: this.memberInfo.mobile };
        }
        this.memberInfo.info = null;
        this.http.post(url, params).then((result) => {
            this.memberInfo.info = result;
            this.memberInfo.mobile = result.mobile || result.contact;
        }).catch((response) => {
            if (response.error && response.error.code === "USER_NOT_EXIST") {
                this.notification.error("提示信息", "会员不存在");
            } else {
                this.notification.error("提示信息", "会员查询失败");
            }
        });
    }

    /**
     * 头像展示
     */

    showImgList: any = [];
    public active: number = 0;
    isActiveImg = null;

    // 上一张
    prev() {
        if (!this.showImgList.length) {
            return;
        }
        if (this.active == 0) {
            this.active = this.showImgList.length - 1;
        } else {
            this.active--;
        }
        this.setSliderPosition()
    }

    // 下一张
    next() {
        if (!this.showImgList.length) {
            return;
        }
        if (this.active == this.showImgList.length - 1) {
            this.active = 0;
        } else {
            this.active++
        }

        this.setSliderPosition()
    }

    // 上传图片
    uploadShowImg(data) {
        this.active = this.showImgList.push(data) - 1;
        this.setSliderWidth()
    }

    // 设置宽度Slider
    setSliderWidth() {
        let num = this.showImgList.length;
        this.slider.nativeElement.style.width = (85 * num) + 'px';
        this.setSliderPosition()
    }

    // 计算slider的left
    setSliderPosition() {
        if (this.active >= 5) { // 超出第6个算起
            let left = -((this.active + 1 - 5) * 85);
            this.slider.nativeElement.style.left = left + 'px'
        } else if (this.active == 0 || this.active < 5) {
            if (this.showImgList.length > 5) {
                let left = -(this.active * 85);
                this.slider.nativeElement.style.left = left + 'px'
            }
        }
    }

    // 设为主图
    setActiveImg() {
        if (!this.showImgList.length) {
            return;
        }

        this.showImgList.forEach((item, index) => {
            if (this.active == index) {
                item.checked = true;
            } else {
                item.checked = false;
            }
        })
    }


    // 切换图片
    activeImage(index) {
        this.active = index;
    }

    // 移除图片
    removeImg() {
        let index = this.active;
        this.showImgList.splice(index, 1);
        this.active = index ? index - 1 : index;
        console.log(this.showImgList);

    }

    // 无权限的用户，修改图片
    public amendImg(type) {

        let params: any = {
            staff_id: this.staff.id
        }
        if (type == 'headPhoto') {
            params.avatar = this.avatar;
        }
        if (type == 'showImg') {

            let display_photos = [];
            this.showImgList.forEach(item => {
                if (item.checked) {
                    display_photos.unshift(item.path);
                } else {
                    display_photos.push(item.path)
                }
            });
            params.display_photos = display_photos;
        }
        this.modalService.confirm({
            nzTitle: '提示',
            nzContent: `确定要修改${type == 'showImg' ? '展示图片' : '头像'}`,
            nzOnOk: () => {
                this.http.post('staff/manage/updatePhoto', params).then(res => {
                    this.notification.success('提示', '修改成功!');
                    if (res && type == 'headPhoto') {
                        this.form.setValue("avatar", res.avatar);
                    }

                    if (res && type == 'showImg') {
                        console.log(res);
                        if (res.display_photos) {
                            let newData = [];
                            let obj = {}
                            res.display_photos.forEach((item, index) => {
                                if (index == 0) {
                                    obj = {
                                        path: item,
                                        checked: true
                                    }
                                } else {
                                    obj = {
                                        path: item,
                                        checked: false
                                    }
                                }

                                newData.push(obj)
                            })
                            this.showImgList = newData;
                            this.active = 0;
                        }
                    }
                })
            }
        });
    }

    coversion(data: any) {
        this.positiveVisible = true;
        this.becomeFullMember = data;
    }

    public positiveCancel() {
        this.positiveVisible = false;
        this.form.setBody();
        this.formDate.clearError();
    }

    public disabledDate = (current: Date): boolean => {
        return differenceInCalendarDays(current, this.today) > 0;
    }

    // 转正
    public positiveOk() {
        const parmas = {
            staff_id: this.becomeFullMember.id,
            conversion_date: ''
        }

        if (this.formDate.body.conversion_date) {
            parmas.conversion_date = dayjs(this.formDate.body.conversion_date).format("YYYY-MM-DD")
        }

        this.http.post("staff/manage/conversion", parmas).then(() => {
            this.positiveCancel()
            this.notification.success("提示信息", "转正成功");
            this.collection.load();
        }).catch(error => {
            this.formDate.setError(error.error.data);
        })
    }

    // 转正日期
    public typeChange(value) {
        if(value == 1) {
            this.isShowFormalInput = false;
        }else {
            this.isShowFormalInput = true;
        }
    }

    public disabledFormalDate = (current) => {
        return differenceInCalendarDays(current, this.today) > 0
    }


}
