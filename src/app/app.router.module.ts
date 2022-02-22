import { NgModule } from '@angular/core';
import { RouterModule, Route, PreloadAllModules, RouteReuseStrategy } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { EmptyComponent } from './pages/empty.component';
import { AppLayoutComponent } from './global/layout/app-layout/app-layout.component';
import { HomeComponent } from './pages/home/home.component';
import { SchoolResolve, ClassResolve, ClassService} from './providers/index';
import { CustomReuseStrategy } from './providers/strategy/CustomReuseStrategy';
import { Forbidden } from './pages/forbidden/forbidden';
import { AuthGuard } from '@/providers/index';
import { PacGuard } from "@/providers/permission";



interface RouteExtra extends Route {
  name?: string;
  children?: Routes;
  group?: string;
}

export declare type Routes = RouteExtra[]


const routes: Routes = [
  {
	path: '',
	component: AppLayoutComponent,
    canActivateChild: [AuthGuard, PacGuard],
    children: [
      { path: '', redirectTo: "/home", pathMatch: 'full' },
      { path: 'home', component: HomeComponent },
      { path: 'forbidden', component: Forbidden },
      { path: 'headquarters', loadChildren: './pages/headquarters/headquarters.module#HeadquartersModule'},
      { path: 'school', loadChildren: './pages/school/school.module#SchoolModule', group: 'school', resolve: { school: SchoolResolve }},
      { path: 'class', loadChildren: './pages/class/class.module#ClassModule', group: 'class', resolve: { class: ClassResolve }},
      // { path: 'workers', loadChildren: './pages/workers/workers.module#WorkersModule'},
    ]
  },
  { path: 'login', component: LoginComponent },
  { path: 'empty', component: EmptyComponent },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { useHash: true, preloadingStrategy: PreloadAllModules })
  ],

  declarations: [
    EmptyComponent,
    Forbidden,
  ],

  exports: [RouterModule],

  providers: [
    { provide: RouteReuseStrategy, useClass: CustomReuseStrategy },
    ClassService,
    SchoolResolve,
    ClassResolve
  ]
})
export class AppRoutingModule { }
