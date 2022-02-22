import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'

import { SchoolComponent } from './school/school.component';
import { Routes } from '../../app.router.module';
import { SharedModule } from '../shared/shared.module';
import { CourseManage } from './course-manage/course-manage';
import { StudentComponent } from './student/student.component'
import { FormsModule } from "@angular/forms";
import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component';
import { Http } from '@yilu-tech/ny';
import { HeadQuartersResolve } from "@/providers/resolve/headquarters.resolve";
import { CertificateType } from './setting/certificate-type/certificate-type';
import { CoachManage } from './coach-manage/coach-manage';
import { TemplateComponent } from './setting/template/template.component';
import { SemesterTemplateComponent } from './semester-template/semester-template';
import { CliqueComponent } from './setting/clique/clique';
import { GoalComponent } from './goal/goal.component';
import { CommunicateComponent } from './communicate/communicate.component';
import { ResourceComponent } from './resource/resource.component';
import { PositionComponent } from './position/position.component';
import { ConsultingCourseComponent } from './consulting-course/consulting-course.component';
import { PaymentModeComponent } from './payment-mode/payment-mode.component';


const routes: Routes = [
  { path: 'school', name: 'school.school.list', component: SchoolComponent },
  { path: 'course-manage', name: 'school.course.list', component: CourseManage },
  { path: 'student',name:'school.student.list', component: StudentComponent },
  { path: 'certificate-type',name:'school.certificate-template.list',component: CertificateType},
  { path: 'role-manage', name: 'staff.role.list', component: RoleManageComponent, data: { group: 'teaching' } },
  { path: 'staff-manage', name: 'staff.manage.list', component: StaffManageComponent, data: { group: 'teaching' } },
  { path: 'coach-manage', name:'school.coach.list', component: CoachManage },
  { path: 'semester-template', name: 'school.semester-template.list', component: SemesterTemplateComponent },
  { path: 'clique', name: 'school.clique.list', component: CliqueComponent },

  { path: 'goal', name: 'school.goal.list', component: GoalComponent },
  { path: 'communicate', name: 'school.communicate.list', component: CommunicateComponent },
  { path: 'resource', name: 'school.resource.list', component: ResourceComponent },
  { path: 'position', name: 'school.position.list', component: PositionComponent },
  { path: 'consulting-course', name: 'school.consulting-course.list', component: ConsultingCourseComponent },
  { path: 'payment-mode', name: 'school.payment-mode.list', component: PaymentModeComponent },
]

@NgModule({
  declarations: [
    SchoolComponent,
    CourseManage,
    StudentComponent,
    CertificateType,
    CoachManage,
    TemplateComponent,
    SemesterTemplateComponent,
    CliqueComponent,
    GoalComponent,
    CommunicateComponent,
    ResourceComponent,
    PositionComponent,
    ConsultingCourseComponent,
    PaymentModeComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(routes),
    FormsModule,
    SharedComponentModule
  ],
  providers: [
    Http.middleware(HeadQuartersResolve)
],
})
export class HeadquartersModule {
}
