import { Injectable, EventEmitter } from '@angular/core'
import { NavigationEnd, Route, Router } from '@angular/router';
import { ROUTES_INFO, ClassService } from '@/providers/index'
import { PacService } from '@/providers/permission';

type MenuItem = {
    label: string;
    level?: number;
    children?: MenuItem[],
    routerLink?: string;
    checked?: Boolean,
    disabled?: Boolean,
    parent?: MenuItem,
    name?: string;
    icon?: string;
    group?: string;
    dropdown?: MenuDropdown
}

type MenuDropdown = {
    options: MenuDropdownOption[],
    selected?: MenuDropdownOption
}

type MenuDropdownOption = {
    name: string,
    checked?: boolean
}

export const MenuDropdown: { [name: string]: MenuDropdown } = {
    teachingSchool: { options: [] },
    teachingClass: { options: [] }
};

export const Menus: MenuItem[] = [
    {
        label: '总部', level: 1, group: 'teaching',routerLink: '/headquarters/school',children: [
            { label: '学校管理', icon: 'icon-xuexiaohui', routerLink: '/headquarters/school' },
            { label: '学期模板管理', icon: 'icon-moban', routerLink: '/headquarters/semester-template'},
            { label: '课程管理', icon: 'icon-kecheng', routerLink: '/headquarters/course-manage' },
            { label: '学员管理', icon: 'icon-xueyuanguanli2', routerLink: '/headquarters/student' },
            { label: '教练管理', icon: 'icon-xiaoshou', routerLink: '/headquarters/coach-manage' },
            {
                label: '员工管理', icon: 'icon-kehu', routerLink: '/headquarters/staff-manage', children: [
                    { label: '员工', icon: 'icon-kehu', routerLink: '/headquarters/staff-manage' },
                    { label: '角色', icon: 'icon-yuangong', routerLink: '/headquarters/role-manage' }
                ]
            },
            {
                label: '基础设置', icon: 'icon-shezhi1', children: [
                    { label: '证书种类', routerLink: '/headquarters/certificate-type' },
                    { label: '注册派别', routerLink: '/headquarters/clique' },
                    { label: '学习目的', routerLink: '/headquarters/goal' },
                    { label: '咨询课程', routerLink: '/headquarters/consulting-course' },
                    { label: '沟通方式', routerLink: '/headquarters/communicate' },
                    { label: '资源类型', routerLink: '/headquarters/resource' },
                    { label: '学员身份', routerLink: '/headquarters/position' },
                    { label: '支付方式', routerLink: '/headquarters/payment-mode' },
                ]
            },
        ],
    },

    {
        label: '学校', level: 1, group: 'teaching_school', routerLink: '/school/semester', children: [
            {
                label: '学期管理', icon: 'icon-xueqi', children: [
                    { label: '学期信息管理', routerLink: '/school/semester' },
                    { label: '证书颁发记录', routerLink: '/school/certificate-record' }
                ]
            },
            {
                label: '报名管理', icon: 'icon-baomingguanli', children: [
                    { label: '学员报名', routerLink: '/school/sign-up' },
                    { label: '报名订单', routerLink: '/school/sign-order' },
                    { label: '转学审批', routerLink: '/school/transfer-school'},
                ]
            },
            {
                label: '班级管理', icon: 'icon-banjiguanli', routerLink: '/school/class-manage', children: [
                    { label: '班级信息管理', routerLink: '/school/class-manage' },
                    { label: '学员分班管理', routerLink: '/school/distribute-class' }
                ]
            },
            { label: '教室管理', icon: 'icon-jiaoshi1', routerLink: '/school/classroom' },
            { label: '宿舍管理', icon: 'icon-susheguanli', routerLink: '/school/dormitory' },
            { label: '学员管理', icon: 'icon-xueyuanguanli2', routerLink: '/school/student' },
            { label: '课程管理', icon: 'icon-kecheng', routerLink: '/school/course-manage' },
            { label: '成绩单', icon: 'icon-kaoshi', routerLink: '/school/transcript' },
            {
                label: '员工管理', routerLink: '/school/staff-manage', icon: 'icon-kehu', children: [
                    { label: '员工', routerLink: '/school/staff-manage' },
                    { label: '角色', routerLink: '/school/role-manage' }
                ]
            },

        ], dropdown: MenuDropdown.teachingSchool
    },

    {

        label: '班级', level: 1, group: 'teaching_class', routerLink: '/class/course-plan', children: [
            { label: '课表', icon: 'icon-kebiao', routerLink: '/class/course-plan' },
            { label: '学员管理', icon: 'icon-xueyuanguanli2', routerLink: '/class/student' },
            { label: '成绩单', icon: 'icon-kaoshi', routerLink: '/class/transcript' },
            {
                label: '员工管理', icon: 'icon-kehu', routerLink: '/class/staff-manage', children: [
                    { label: '员工', routerLink: '/class/staff-manage' },
                    { label: '角色', routerLink: '/class/role-manage' }
                ]
            }
        ], dropdown: MenuDropdown.teachingClass
    }
];

@Injectable()
export class MenuManager {

    public get list() {
        return this._menus;
    }

    public get childList() {
        return this._childMenus;
    }

    public get active() {
        return this._active;
    }

    public parentLevel: number = 1;
    private _menus: MenuItem[] = [];
    private _childMenus: MenuItem[] = [];
    private _active: MenuItem;
    public _onChange: EventEmitter<any> = new EventEmitter<any>()

    constructor(
        public router: Router,
        private classService: ClassService,
        private pacService: PacService
    ) {
        this.boot();

        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
				let path = this.path();				
                if (path === '/forbidden') {
                    return;
                }

                let menu = this.match(path);
                this.setActive(menu);
            }
        });
        this.classService.onLoaded.subscribe(() => this.boot());
        this.pacService.onChange.subscribe(() => this.refresh());
    }

    protected boot() {
        this.classService.do(() => {
            MenuDropdown.teachingSchool.options = this.classService.getSchoolList();
            MenuDropdown.teachingSchool.selected = this.classService.getCurrentSchool();
            MenuDropdown.teachingClass.options = this.classService.getSchoolHalls();
            MenuDropdown.teachingClass.selected = this.classService.getCurrentClassGrade();
        }).then(() => this.refresh())
    }

    /**
     * 刷新数据
     */
    public refresh() {        
        this._menus = this.filter(Menus);        
        // this._menus = menus.filter(item => item.children.length > 0);
        let item = this.match(this.path());

        if (!this.setActive(item)) {
            this.setChileList();
        }
    }

    /**
     *获取地址栏的信息
     */
    public path() {
        return this.router.url.split(/[?;#]/, 2)[0];
    }

    /**
     * 返回发生变化的菜单信息
     * @param url 地址栏的url
     * @param items menus的数据
     */
    public match(url, items = this._menus) {        
        let match = null;
        for (let item of items) {
            if (item.routerLink && item.routerLink === url) {                
                if (!item.children) {
                    return item;
                }
                if (!match) {
                    match = item;
                }
            }            
            if (item.children) {
                let temp = this.match(url, item.children);
                
                if (temp) {
                    if (!temp.children) {
                        return temp;
                    }
                    if (!match) {
                        match = temp;
                    }
                }
            }
        }
        return match;
    }

    /**
     * 过滤菜单数据
     * @param Menus
     */
    protected filter(menus: MenuItem[], parent = null) {
        let items = [];        
        for (let item of menus) {            
            item.parent = parent;
            if (item.dropdown) {
                if (!item.dropdown.options.length) {
                    continue;
                }
                if (item.children) {
                    item = { ...item };
                    item.children = this.filter(item.children, item);
                }
                items.push(item);
            } else if (item.children) {                
                item = { ...item };                
                item.children = this.filter(item.children, item);
                if (item.children.length > 0) {
                    items.push(item);                    
                }
            } else if (this.check(item)) {                
                items.push(item);
            }            
        }                
        return items;
    }

    /**
     * 菜单的点击事件
     * @param item 点击菜单的相关信息
     */
    public navigate(item: MenuItem) {
		if (item.hasOwnProperty('dropdown')) {
			if (!item.dropdown.options.length) {
				return;
			}			
		}

        if (!item.routerLink || item.disabled) {
            return;
        }
        if (item.children && !this.check(item)) {
            while (item.children && item.children.length) {
                item = item.children[0];
            }
        }
        this.router.navigateByUrl(item.routerLink);
    }

    /**
     * 设置侧边栏
     */
    private setChileList() {
        let parent = this.getActiveParent();

        if (parent && parent.children) {
            this._childMenus = parent.children;
        } else {
            parent = this.getDefaultParent();
            if (parent) {
                this.setActive(parent);
            } else {
                this._childMenus = [];
            }
        }
    }

    /**
     * 检查是否选中的状态
     * @param item 点击导航后，match返回的数据
     */
    public setActive(item: MenuItem) {
        if (this._active) {
            this.changeMenuActive(this._active, false);
        }
        if (item) {
            this.changeMenuActive(item, true);
        }
        if (this._active === item) {
            return false;
        }

        this._active = item;
        this.setChileList();
        this._onChange.emit(item);

        return true;
    }

    /**
     * 设置选中状态
     * @param menuItem
     * @param bool
     */
    protected changeMenuActive(menuItem: MenuItem, bool: Boolean) {

        menuItem.checked = bool;
        if (menuItem.parent) {
            this.changeMenuActive(menuItem.parent, bool);
        }
    }

    private check(item: MenuItem) {                
        if (!item.routerLink) {
            return true;
        }
        let info = ROUTES_INFO[item.routerLink];        
        if (!info) {
            return false;
        }
        
        return this.pacService.exists(info.name, info.group || '');
    }

    /**
     * 获取父级的状态
     */
    public getActiveParent() {
        let item = this.active;
        while (item) {
            if (item.level === this.parentLevel) {
                return item;
            }
            item = item.parent;
        }
        return null;
    }

    public getDefaultParent(items = this._menus) {
        for (let item of items) {
            if (!item.children) {
                continue;
            }
            if (item.level === this.parentLevel) {
                return item;
            }
            let parent = this.getDefaultParent(item.children);
            if (parent) {
                return parent;
            }
        }
        return null;
    }

    public checkOption(menuItem: MenuItem, option) {
        if (menuItem.dropdown.selected === option) {
            return;
        }
        if (menuItem.dropdown.selected) {
            menuItem.dropdown.selected.checked = false;
        }
        option.checked = true;
        menuItem.dropdown.selected = option;
    }
}
