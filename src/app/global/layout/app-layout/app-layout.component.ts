import { Component, OnInit } from '@angular/core';
import { Config } from '@/config';
import { NzIconService } from 'ng-zorro-antd';
import { Router, ChildrenOutletContexts, PRIMARY_OUTLET } from '@angular/router';
import { Auth, Cache, Http } from '@yilu-tech/ny';
import { RouteStash } from '@/providers/strategy/route.stash';
import { ClassService } from '@/providers/index'
import { MenuManager, MenuDropdown } from './../../menu';
import { NzNotificationService } from "ng-zorro-antd";

@Component({
  selector: 'app-app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss']
})
export class AppLayoutComponent implements OnInit {
  public config = Config;
  public collapsed: boolean = false;
  public changePasswordVisible: boolean;
  public user: any = {};
  public formData: any = {};
  public get component(): any {
    return this.parentContexts.getContext(PRIMARY_OUTLET).outlet.component;
  }

  constructor(
    public menu: MenuManager,
    private _iconService: NzIconService,
    private parentContexts: ChildrenOutletContexts,
    private auth: Auth,
    private http: Http,
    private cache: Cache,
    private router: Router,
    private classService: ClassService,
    private notification: NzNotificationService
  
  ) {
    this._iconService.fetchFromIconfont({
      scriptUrl: this.config.iconFont
    });
    this.user = this.auth.user();
  }

  ngOnInit() {

  }
  loginOut() {
    this.auth.loginOut();
    this.cache.clear();
    RouteStash.main.unstash().clear();
    this.router.navigate(['login']);
  }

  public checkOption(menuItem, option) {	  
    if (option.checked) {
      return;
    }
    this.menu.checkOption(menuItem, option);
    if (menuItem.group === 'teaching_school') {
      this.classService.setCurrentSchool(option);
      MenuDropdown.teachingClass.options = this.classService.getSchoolHalls();
      MenuDropdown.teachingClass.selected = this.classService.getCurrentClassGrade();
    }

    if (menuItem.group === 'teaching_class') {
      this.classService.setCurrentClassGrade(option);
    }

    this.pageReload().then(() => {
      this.menu.refresh();      
    });

  }

  pageReload() {
    RouteStash.main.unstash().clear();
    let url = this.router.url;
    return this.router.navigateByUrl('/empty', { skipLocationChange: true }).then(() => this.router.navigateByUrl(url));
  }
  
  public changePassword() {
    this.http.post('staff/info/changepassword', this.formData).then(() => {
      this.changePasswordVisible = false;
      this.formData = {};
      this.notification.success('提示', '密码修改成功');
    });
  }
}
