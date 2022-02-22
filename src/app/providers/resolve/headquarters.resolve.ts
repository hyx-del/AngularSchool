import { Injectable } from "@angular/core";
import { Resolve } from '@angular/router';
import { ClassService } from "@/providers/services/class.service";
import { HttpMiddleware, HttpRequest } from "@yilu-tech/ny";

@Injectable()
export class HeadQuartersResolve implements Resolve<any>, HttpMiddleware {
    constructor(private classService: ClassService) {

    }

    resolve(route) {
        return this.classService.do(() => this.classService.getCurrentClassGrade())
    }

    public handle(request: HttpRequest, next: (request: HttpRequest) => Promise<any>): Promise<any> {
        request.addHeader('Auth-Group', 'teaching');
        return next(request);
    }
}
