import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { Config } from '@/config';
import { isTemplateRef, NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { FileService } from '@/providers/index';

@Component({
  selector: 'app-course',
  templateUrl: './course-manage.html',
  styleUrls: ['./course-manage.scss']
})
export class CourseManage implements OnInit {
  collection: any = {};
  public buttons = [
    { name: 'create', click: () => this.showAddModal() }
  ];

  public ossPath: string;

  constructor(
    private http: Http,
    private notification: NzNotificationService,
    private fileService: FileService,
    private nzModalService: NzModalService
  ) {
    this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
      this.ossPath = path;
    })
  }

  ngOnInit() {
  }

  setCollection(collection) {
    this.collection = collection;
    collection.onSetHeader = () => {
        collection.getHeader('name').click = (item) => this.change(item);
    }
  }

  showAddModal() {
    this.visible = true;
  }


  /**********************************添加课程****************************************/

  public form: nyForm;
  public visible = false;
  public UploadLoading: boolean = false;

  public params: any = {
        examine: 1
  };

  public remark: string;

  public cancel() {
    this.visible = false;
    this.form.body = {};
    this.remark = null;
    this.params = {
        examine: 1,
    };
    this.form.clearError();
  }

  public save() {
    if (this.params.id) {
      this.form.action = "school/teaching/course/update";
    } else {
      this.form.action = "school/teaching/course/create";
    }
    this.form.submit().then(res => {
      this.cancel();
      this.notification.success('提示信息', `${this.params.id ? '修改' : '添加'}成功`);
      this.collection.load();
    })
  }

  public onFormInit() {
    this.form.request = this.http.request.bind(this.http);
    this.form.onSubmit = body => {
      body.remark = this.remark;
      console.log(this.params.examine);
      
      body.examine = this.params.examine;
      if (this.params.id) {
        body.id = this.params.id;
      }
    }
  }

  // 上传图片
  public uploadImg = (item) => {
    let formData = new FormData();
    formData.set('images[]', item.file);
    const isLtMaxSize = item.file.size / 1024 / 1024 < Config.imageMaxSize;
    if (!isLtMaxSize) {
      this.notification.error("提示信息", `请上传${Config.imageMaxSize}M以内的图片`);
      return;
    }

    this.UploadLoading = true;

    this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData).then(urls => {
      this.params.picture = urls[0];
      if (this.params.id) {
        this.form.setValue('picture', urls[0]);
      } else {
        this.form.setValue('picture', urls[0]);
      }
      this.UploadLoading = false;
    }).catch(() => {
      this.UploadLoading = false;
    });
  }

  // 课程修改
  public async change(item) {
    const data = await this.http.post('school/teaching/course/detail', { id: item.id });
    if (data) {
      this.visible = true;
      this.params =this.form.body = data;
      this.remark = data.remark || '<p></p>';
    }
  }

  // 删除
  public remove(item) {
    this.nzModalService.confirm({
      nzTitle: '确认删除吗?',
      nzOnOk: async () => {
        try {
          await this.http.post('school/teaching/course/delete', { id: item.id });
          this.notification.success('提示信息', '删除成功');
          this.collection.load();
        } catch (error) {
          console.log(error);
        }
      }
    })
  }

  // 禁用
  public disable(item) {
    this.nzModalService.confirm({
      nzTitle: '确认禁用吗?',
      nzOnOk: async () => {
        try {
          await this.http.post('school/teaching/course/disable', { id: item.id });
          this.notification.success('提示信息', '禁用成功');
          this.collection.load();
        } catch (error) {
          console.log(error);
        }
      }
    })
  }

  // 启用
  public startUse(item) {
    this.nzModalService.confirm({
      nzTitle: '确认启用吗?',
      nzOnOk: async () => {
        try {
          await this.http.post('school/teaching/course/enable', { id: item.id });
          this.notification.success('提示信息', '启用成功');
          this.collection.load();
        } catch (error) {
          console.log(error);
        }
      }
    })
  }

}



