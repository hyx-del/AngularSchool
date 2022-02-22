type Route = {
    label: string,
    name: string,
    group?: string,
    actions?: {
        [action: string]: Action
    }
}

type Action = {
    name: string
    label: string
    group?: string,
}

type RoutesInfo = {
    [path: string]: Route
}

export const ROUTES_INFO: RoutesInfo = {
    '/headquarters/school': {
        name: 'school.school.list', label: '学校管理', group: 'teaching'
    },
    '/headquarters/course-manage': {
        name: 'school.course.list', label: '课程管理', group: 'teaching'
    },
    '/headquarters/student': {
        name: 'school.student.list', label: '学员管理', group: 'teaching'
    },
    '/headquarters/coach-manage': {
        name: 'school.coach.list', label: '教练管理', group: 'teaching'
    },
    '/headquarters/certificate-type': {
        name: 'school.certificate-template.list', label: '证书种类', group: 'teaching'
    },
    '/headquarters/staff-manage': {
        name: 'staff.manage.list', label: '员工管理', group: 'teaching'
    },
    '/headquarters/role-manage': {
        name: 'staff.role.list', label: '角色', group: 'teaching'
    },
    '/headquarters/semester-template': {
        name: 'school.semester-template.list', label: '学期模板管理', group: 'teaching'
    },
    '/headquarters/clique': {
        name: 'school.clique.list', label: '注册派别', group: 'teaching'
    },
    '/headquarters/goal': {
        name: 'school.goal.list', label: '学习目的', group: 'teaching'
    },
    '/headquarters/communicate': {
        name: 'school.communicate.list', label: '沟通方式', group: 'teaching'
    },
    '/headquarters/resource': {
        name: 'school.resource.list', label: '资源类型', group: 'teaching'
    },
    '/headquarters/position': {
        name: 'school.position.list', label: '学员身份', group: 'teaching'
    },
    '/headquarters/consulting-course': {
        name: 'school.consulting-course.list', label: '咨询课程', group: 'teaching'
    },

    /************* 学校 ***************/
    '/school/classroom': {
        name: 'school.classroom.list', label: '教室管理', group: 'teaching_school'
    },
    '/school/dormitory': {
        name: 'school.dorm.list', label: '宿舍管理', group: 'teaching_school'
    },
    '/school/class-manage': {
        name: 'school.class.list', label: '班级信息管理', group: 'teaching_school'
    },

    '/school/distribute-class': {
        name: 'school.class.list', label: '学员分班管理', group: 'teaching_school'
    },
    '/school/course-manage':{ 
        name: 'school.course.list', label: '课程管理', group: 'teaching_school'
    },
    '/school/transcript': {
        name: 'school.achievement.list', label: '成绩单', group: 'teaching_school'
    },
    '/school/sign-up': {
        name: 'school.student-semester.list', label: '学员报名', group: 'teaching_school'
    },
    '/school/transfer-school': { 
        name: 'school.transfer-school.audit-list', label: '转学审批', group: 'teaching_school'
    },
    '/school/sign-order': {
        name: 'school.order.list', label: '报名订单', group: 'teaching_school'
    },
    '/school/semester': {
        name: 'school.semester.list', label: '学期信息管理', group: 'teaching_school'
    },
    '/school/certificate-record': {
        name: 'school.certificate.list', label: '证书颁发记录', group: 'teaching_school'
    },
    '/school/student': {
        name: 'school.student.list', label: '学员管理', group: 'teaching_school'
    },
    '/school/staff-manage': {
        name: 'staff.manage.list', label: '员工管理', group: 'teaching_school'
    },
    '/school/role-manage': {
        name: 'staff.role.list', label: '角色', group: 'teaching_school'
    },

    /************** 班级 ****************/

    '/class/course-plan':{
        name:'school.course-plan.list',label:'课表', group:'teaching_class'
    },
    '/class/transcript': {
        name: 'school.achievement.list', label: '成绩单', group: 'teaching_class'
    },
    '/class/student': {
        name: 'school.student.list', label: '学员管理', group:'teaching_class'
    },
    '/class/staff-manage': {
        name: 'staff.manage.list', label: '员工管理', group: 'teaching_class'
    },
    '/class/role-manage': {
        name: 'staff.role.list', label: '角色', group:'teaching_class'
    },
    '/headquarters/payment-mode': {
        name: 'school.payment-mode.list', label: '支付方式', group: 'teaching'
    },
}
