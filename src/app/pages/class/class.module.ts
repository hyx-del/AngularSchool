import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'

import { Routes } from '../../app.router.module';
import { Http } from '@yilu-tech/ny';
import { ClassResolve } from "@/providers/resolve/class.resolve";
import { CoursePlan } from './course-plan/course-plan'
import { SharedModule } from '../shared/shared.module';
import { SharedComponentModule, RoleManageComponent, StaffManageComponent } from '../shared-component';
import { Student } from './student/student';
import { FormsModule } from "@angular/forms";
import { StudentDetail } from './student-detail/student-detail';
import { Transcript } from './transcript/transcript';

const routes: Routes = [
    { path: 'course-plan',  name: 'school.course-plan.list', component: CoursePlan },
    { path: 'role-manage', name: 'staff.role.list', component: RoleManageComponent, data: { group: 'teaching_class' } },
    { path: 'staff-manage', name: 'staff.manage.list', component: StaffManageComponent, data: { group: 'teaching_class' } },
    { path: 'student', name: 'school.student.list', component: Student },
    { path: 'transcript', name: 'school.achievement.list', component: Transcript }
]

@NgModule({
    declarations: [
        CoursePlan,
        Student,
        StudentDetail,
        Transcript,
    ],
    providers: [
        Http.middleware(ClassResolve)
    ],
    imports: [
        SharedModule,
        CommonModule,
        RouterModule.forChild(routes),
        SharedComponentModule,
        FormsModule
    ]
})
export class ClassModule {
}
