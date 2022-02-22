import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { registerLocaleData, CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app.router.module';
import { Provider } from './app.providers'

import { AppComponent } from './app.component';
import { NgZorroAntdModule, NZ_I18N, zh_CN } from 'ng-zorro-antd';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import zh from '@angular/common/locales/zh';

import { LoginComponent } from './pages/login/login.component';
import { AppLayoutComponent } from './global/layout/app-layout/app-layout.component';
import { PageTabComponent } from './global/layout/page-tab/page-tab.component';
import { HomeComponent } from "./pages/home/home.component";

import { NyProviderModule, registerConfig } from '@yilu-tech/ny';
import { Config } from './config';
import { RouterModule } from '@angular/router';


registerConfig(Config);
registerLocaleData(zh);

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    AppLayoutComponent,
    PageTabComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgZorroAntdModule,
    FormsModule,
    CommonModule,
    HttpClientModule,
    NyProviderModule,
    ReactiveFormsModule,
    RouterModule,
    BrowserAnimationsModule
  ],
  providers: [
    Provider,
    { provide: NZ_I18N, useValue: zh_CN },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
