import { Component, OnInit } from '@angular/core';
import { Http } from "@yilu-tech/ny/index";
import { FileService } from "@/providers/file-service";
import { NzModalService, NzNotificationService } from "ng-zorro-antd";
import { Config } from "@/config";
import { ClassService } from "@/providers/index"
import { DomSanitizer } from '@angular/platform-browser';
import * as dayjs from 'dayjs';
import * as print  from 'print-js'

@Component({
    selector: 'app-student',
    templateUrl: './student.html',
    styleUrls: ['./student.scss']
})
export class Student implements OnInit {

    public ossPath: string;

    constructor(
        private http: Http,
        private fileService: FileService,
        private notification: NzNotificationService,
        private classService: ClassService,
        private sanitizer: DomSanitizer,
        private nzModalService: NzModalService,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        })
    }

    collection: any = {};

    public certificateModelVisible = false;
    public changeStudentVisible = false;
    public infoForm: nyForm;
    public params: any = {};
	
	public certificateToSeeVisible = false;

	public certificateDetails: any = {};

    public buttons = [
        { label: '批量派发证书', isAddNewBtn: true, click: () => this.distributeCertificate() },
    ];

    public statusData = [
        { label: '潜在', value: 10 },
        { label: '学员', value: 20 },
        { label: '毕业', value: 30 },
    ];

    public registerGradeData = [
        { label: '普通', value: 10 },
        { label: '高级', value: 20 },
    ];

    public uploadLoading = false;
    public picture: string;
    public sexValue = 1;

    public provinceList = [];
    public cityList = [];
    public areaList = [];
    public semesterName: string;

    public certificateForm: nyForm; // 颁发证书nyForm
    public loading = false;
    public student_id: Array<any> = [];
    public certificate_template_id = '';
    public semesterId: string;
    public certificateTemplateList = [];
    private promiseArr = [];
    public templateData: any;
    public imgSrc: any;

    private canvasWidth: number;
    private canvasHeight: number;
	private imageArr: Array<any> = [];
	private studentDetails = [];

    ngOnInit() {
    }

    setCollection(collection) {
        console.log(collection)
        this.collection = collection;
        this.collection.showCheckbox = true;
        collection.onSetHeader = () => {
            collection.getHeader('name').click = (item) => this.details(item);
        }
    }

    public distributeCertificate(item?) {        
		this.studentDetails = []; // 防止失败、重复点击导致数据重复添加
		if (item) {
			this.studentDetails.push(item);
			this.student_id = [item.student_id]
		}else {
			if (!this.collection.checkedItems.length) {
				this.notification.info('提示信息', '请选择要派发的学员！');
				return;
			}
			this.studentDetails = this.collection.checkedItems;
			this.student_id = this.collection.checkedItems.map(item => item.student_id);
		}
        
        this.getSemesterList();
		this.getCertificateTemplateList();		
        this.certificateModelVisible = true;
    }

    public async certificateModelOK() {
        this.loading = true;
        if (this.semesterId) {
            try {				
                this.imageArr = await this.setTemplatePicture();                		
                this.certificateForm.action = 'school/teaching-class/certificate/create';
            } catch (e) {
                this.notification.error('提示信息', '证书图片上传失败!');
                this.loading = false;
            }
		}
		
        this.certificateForm.submit().then(res => {
            this.notification.success('提示信息', '颁发证书成功！');
            this.certificateModelCancel();
            this.collection.load();
            this.loading = false;
        }).catch(error => {			
            this.loading = false;
        })
    }

    public subCertificateForm() {
        this.certificateForm.request = this.http.request.bind(this.http);
        this.certificateForm.onSubmit = (body) => {
            body.student_id = this.student_id;
			body.image = this.imageArr;
			body.semester_id = this.semesterId;
			body.certificate_template_id = this.certificate_template_id;
        }
    }

    private setTemplatePicture(): Promise<any> {
        this.promiseArr = [];
        if (!this.templateData) {
            return;
        }

        const url = this.ossPath + this.templateData[0].picture;                
        this.studentDetails.forEach(async (user) => { // 替换内容文本
            let arr = new Promise(async (resolve, reject) => {
                const dom = new DOMParser().parseFromString(this.templateData[0].template, 'image/svg+xml');
                const baseUrl = await this.getBase64Image(url);

                dom.getElementsByTagName('image')[0].setAttribute('xlink:href', baseUrl);

                const newDom = this.replaceTextContent(dom, user);
                
                const svgStr = new XMLSerializer().serializeToString(newDom);

                const file = await this.svgToPng(svgStr, true);

                try {
                    const imageArr = await this.uploadImage(file);
                    resolve(imageArr[0]);
                } catch (e) {
                    reject(e)
                }
            });
            this.promiseArr.push(arr); 
        });

       return Promise.all(this.promiseArr)
    }

    private replaceTextContent(dom, user) {
        // if (!dom.querySelectorAll('#svg>text').length) {
        //     this.notification.info('提示信息', '模板错误请重新添加模板!');
        //     return;
        // }
        dom.querySelectorAll('#svg>text').forEach(item => {
            switch (item.getAttribute('_field')) {
                case 'name':
                    item.innerHTML = user.englishName ? user.englishName + ' ' + user.name : user.name;
                    break;
                case 'number':
                    item.innerHTML = user.idCard ? user.idCard : null;
                    break;
                case 'date':
                    item.innerHTML = dayjs().format("YYYY-MM-DD");
                    break;
                default:
                    break;
            }
        });
        return dom;
    }

    public certificateModelCancel() {
        this.certificateModelVisible = false;
        this.loading = false;
        this.certificateForm.body = {};
        this.certificateForm.clearError();
        this.imageArr = [];
        this.imgSrc = '';
        this.certificate_template_id = null;
    }

    // 获取学期数据
    public getSemesterList() {
        const data = this.classService.getCurrentSchool();
        const params = {
            school_id: data.id,
        }
        this.http.get('school/teaching-school/school/get-semester-list', params).then(res => {
			this.semesterName = res[0].name;
			this.semesterId = res[0].id;
        })
    }

    // 获取证书模板数据
    public getCertificateTemplateList() {
        this.http.get('school/teaching-school/certificate-template/get-list').then(res => {
            this.certificateTemplateList = res;
        })
    }

    // 证书改变
    public async certificateChange(event) {
        this.templateData = this.certificateTemplateList.filter(item => item.id == event);
        const dom = new DOMParser().parseFromString(this.templateData[0].template, 'image/svg+xml');

        let svgWidth = dom.getElementById('svg').style.width;
        let svgHeight = dom.getElementById('svg').style.height;
        this.canvasWidth = parseFloat(svgWidth);
        this.canvasHeight = parseFloat(svgHeight);

        const url = this.ossPath + this.templateData[0].picture;
        const baseUrl = await this.getBase64Image(url);

        dom.getElementsByTagName('image')[0].setAttribute('xlink:href', baseUrl);
        const newDomStr = new XMLSerializer().serializeToString(dom);
        this.imgSrc = await this.svgToPng(newDomStr)
    }

	// 查看证书
	public showCertificate(item) {		
		this.http.post('school/teaching-class/certificate/show', {student_id: item.student_id}).then(res=>{
			this.certificateToSeeVisible = true;
			this.certificateDetails = res;			
		})
		
	}

	public closeDrawer() {
		this.certificateToSeeVisible = false;
		this.loading = false;
		this.studentDetails = [];
	}

	public print() {
        const src = this.ossPath + this.certificateDetails.certificate;
        print(src, 'image')
        
	}

    /**
     *  将线上的图片转成base64,不转svg中的image标签无法画到canvas上
     * @param Url
     * @private
     */
    private getBase64Image(Url): Promise<any> {
        let image = new Image();
        image.src = Url;
        image.crossOrigin = 'anonymous';

        return new Promise(resolve => {
            image.onload = async () => {
                var canvas = document.createElement("canvas");
                canvas.width = image.width;
                canvas.height = image.height;
                canvas.getContext("2d").drawImage(image, 0, 0);
                var baseUrl = canvas.toDataURL("image/png");
                resolve(baseUrl);
            }
        })


    }

    /**
     * svg转图片
     * @param svg svg Dom
     * @private
     */
    private svgToPng(svg, isupload?: boolean): Promise<any> {
        const url = this.getSvgUrl(svg);
        return new Promise(resolve => {
            this.svgUrlToPng(url, isupload).then(res => {
                resolve(res);
            })
        })
    }

    /**
     * 将svg转成Base64
     * @param svg svg Dom
     * @private
     */
    private getSvgUrl(svg) {
        return window.btoa(unescape(encodeURIComponent(svg)));
    }

    /**
     * 将svg转成图片
     * @param svgUrl svg的Base64
     * @private
     */
    private svgUrlToPng(svgUrl, isupload?: boolean): Promise<any> {
        let svgImage = new Image();
        svgImage.src = 'data:image/svg+xml;base64,' + svgUrl;
        svgImage.width = this.canvasWidth;
        svgImage.height = this.canvasHeight;
        return new Promise(resolve => {
            svgImage.onload = async () => {
                const canvas = document.createElement('canvas');
                canvas.width = this.canvasWidth;
                canvas.height = this.canvasHeight;
                canvas.getContext('2d').drawImage(svgImage, 0, 0);
                if (isupload) {
                    canvas.toBlob(blob => {
                        resolve(this.blobToFile(blob, 'file.png'));
                    });
                    return;
                }
                resolve(canvas.toDataURL('image/png'));
            };
        })

    }

    /**
     * blobToFile
     * @param blod Blod类型
     * @param fileName 文件名
     */
    private blobToFile(blod, fileName: string): File {
        let b: any = blod;

        // 一个Blob 几乎就是一个File —— 它只是缺少了下面要添加的两个属性
        b.lastModifiedDate = new Date();
        b.name = fileName;

        return <File>blod;
    }

    // 证书图片上传
    private async uploadImage(allFile): Promise<any> {
        let formData = new FormData();
        formData.set('images[]', allFile);
        try {
            const urls = this.http.post('file/upload/image?bucket=' + Config.buckets.admin, formData);
            return Promise.resolve(urls);
        } catch (e) {
            Promise.reject(e);
        }
    }

    /**
     * 详情
     */
    public detailVisible = false;

    public detail: any;

    public details(item) {
        this.detail = item;
        this.detailVisible = true;
    }

    public close(callback: boolean) {
        this.detailVisible = callback;
    }
}
