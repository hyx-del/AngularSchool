import { Injectable } from "@angular/core";
import { Resolve } from '@angular/router';
import { ClassService } from "@/providers/services/class.service";
import { HttpMiddleware, HttpRequest } from "@yilu-tech/ny";

@Injectable()
export class ClassResolve implements Resolve<any>, HttpMiddleware {
    constructor(private classService: ClassService) {

    }

    resolve(route) {
        return this.classService.do(() => this.classService.getCurrentClassGrade())
    }

    public handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        if (!request.hasParams("class_id")) {
            let classGrade = this.classService.getCurrentClassGrade();
            request.addParams('class_id', classGrade && classGrade.id);
        }
        return next(request);
    }
}
