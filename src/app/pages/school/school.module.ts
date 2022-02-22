import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'
import { Routes } from '../../app.router.module';

import { ClassroomComponent } from './classroom/classroom.component';
import { SemesterComponent } from './semester/semester.component';
import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component';

import { SharedModule } from '../shared/shared.module';
import { FormsModule } from "@angular/forms";
import { Http } from '@yilu-tech/ny';
import { SchoolResolve } from "@/providers/resolve/school.resolve";
import { StudentComponent } from './student/student.component';
import { DormitoryComponent } from './dormitory/dormitory.component';
import { StudentDetail } from './student-detail/student-detail';
import { ClassManage } from './class-manage/class-manage';
import { DistributeClass } from './distribute-class/distribute-class';
import { ReportCard } from './report-card/report-card';
import { SemesterDetailComponent } from './semester-detail/semester-detail.component';
import { SignUpComponent } from './sign-up-manage/sign-up/sign-up.component';
import { SignOrderComponent } from './sign-up-manage/sign-order/sign-order.component';
import { SignDetailComponent } from './sign-up-manage/sign-detail/sign-detail.component';
import { CertificateRecord } from './certificate-record/certificate-record';
import { CourseManage } from './course-manage/course-manage';
import { TransferSchoolComponent } from './sign-up-manage/transfer-school/transfer-school';

const routes: Routes = [
    { path: 'classroom', name: 'school.classroom.list', component: ClassroomComponent },
    { path: 'semester', name: 'school.semester.list', component: SemesterComponent },
    { path: 'student', name: 'school.student.list', component: StudentComponent },
    { path:'dormitory',name:'school.dorm.list',component:DormitoryComponent },
    { path: 'role-manage', name: 'staff.role.list', component: RoleManageComponent, data: { group: 'teaching_school' } },
    { path: 'staff-manage', name: 'staff.manage.list', component: StaffManageComponent, data: { group: 'teaching_school' } },
    { path: 'class-manage', name: 'school.class.list', component: ClassManage },
    { path: 'distribute-class', name: 'school.class.list', component: DistributeClass },
    { path: 'transcript', name: 'school.achievement.list', component: ReportCard },
    { path: 'sign-up', name: 'school.student-semester.list', component:SignUpComponent},
    { path: 'sign-order', name: 'school.order.list', component:SignOrderComponent},
    { path: 'certificate-record', name:'school.certificate.list', component: CertificateRecord},
    { path: 'course-manage',name:'school.course.list', component:CourseManage },
    { path: 'transfer-school',name:'school.transfer-school.audit-list', component: TransferSchoolComponent },
  ];


@NgModule({
  declarations: [
    ClassroomComponent,
    SemesterComponent,
    StudentComponent,
    DormitoryComponent,
    StudentDetail,
    ClassManage,
    DistributeClass,
    ReportCard,
    SemesterDetailComponent,
    SignUpComponent,
    SignOrderComponent,
    SignDetailComponent,
    CertificateRecord,
    CourseManage,
    TransferSchoolComponent,
  ],
  providers: [
    Http.middleware(SchoolResolve)
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedComponentModule
  ]
})
export class SchoolModule {
}
