import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgZorroAntdModule } from 'ng-zorro-antd';

import { SharedModule } from '../shared/shared.module'
import { RoleManageComponent } from "./role-manage/role.manage";
import { StaffManageComponent } from "./staff-manage/staff-manage";

import { RoleService } from '@/providers/services/role.service'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgZorroAntdModule,
    SharedModule,
  ],
  declarations: [
    RoleManageComponent,
    StaffManageComponent,
  ],
  providers: [
    RoleService,
  ],
  exports: [
    RoleManageComponent,
    StaffManageComponent,
  ],
})
export class SharedComponentModule { }
