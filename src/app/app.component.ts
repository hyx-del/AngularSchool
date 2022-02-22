import { Component } from '@angular/core';
import { Http } from '@yilu-tech/ny';
import { registerFormHttp } from './providers/form';

@Component({
  selector: 'app-root',
  template: `<router-outlet></router-outlet>`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'school';

  constructor(private http: Http) {
    registerFormHttp(http);
  }
}
