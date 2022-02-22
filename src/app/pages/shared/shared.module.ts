import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgZorroAntdModule } from 'ng-zorro-antd';
import { NyModule } from '@yilu-tech/ny';

import { contentHeader } from './contentheader/content.header';
import { UEditorComponent } from "./ueditor/ueditor.component";
import { FormModel } from '@/providers/form/form.module';
import { CropImageComponent } from './crop-image/crop-image';
@NgModule({
  declarations: [
    contentHeader,
    UEditorComponent,
    CropImageComponent,
  ],
  imports: [
    CommonModule,
    NyModule,
    NgZorroAntdModule,
    FormModel
  ],
  exports:[
    contentHeader,
    NyModule,
    NgZorroAntdModule,
    UEditorComponent,
    FormModel,
    CropImageComponent
  ]
})
export class SharedModule { }
