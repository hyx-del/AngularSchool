import { Injectable } from "@angular/core";
import { Resolve } from '@angular/router';
import { ClassService } from "@/providers/services/class.service";
import { HttpMiddleware, HttpRequest } from "@yilu-tech/ny";

@Injectable()
export class SchoolResolve implements Resolve<any>, HttpMiddleware {
    constructor(private classService: ClassService) {

    }

    resolve(route) {
        return this.classService.do(() => this.classService.getCurrentSchool())
    }

    public handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        if (request.getUrl().indexOf('school/teaching-school/school/get-semester-list') > -1 && request.getParams().isCancelParams) {
            delete request.getParams().isCancelParams;
            return next(request)
        }
        if (request.getUrl().indexOf("staff/manage/getTrainingSalesmanList") > -1) {
            return next(request);
        }
        if (!request.hasParams("school_id")) {
            let school = this.classService.getCurrentSchool();
            request.addParams('school_id', school && school.id);
        }
        return next(request)
    }
}
