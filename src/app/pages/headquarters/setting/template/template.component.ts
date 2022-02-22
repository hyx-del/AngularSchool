import { Component, Input, OnInit, } from '@angular/core';
import { Config } from '@/config';
import { FileService } from '@/providers/index';
import { NzNotificationService, NzModalService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';

@Component({
    selector: 'app-template',
    templateUrl: './template.component.html',
    styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnInit {
    @Input('detailParams') detailParams;

    public ossPath: string;
    public picture: string;

    public width = 1000;
    public height: number;
    public proportion;

    public font = 16;

    public isSetting = true;
    public text = '测试文字';
    public centerValue = true;
    public selectedValue;
    public dataList = [
        { label: '学员名字', value: 'name' },
        { label: '证书编号', value: 'number' },
        { label: '日期时间', value: 'date' }
    ];

    public sizeRange = [
        { label: '1.0', checked: true },
        { label: '0.1', checked: false },
    ]

    public textActiveData: any = {};
    public elIndex: number;
    public allTextDom: any = [];

    public leftPrice = 5;
    public topPrice = 5;
    public setp: number | string = 1;

    public UploadLoading = false;

    /*******证书内容设置******/
    public isShowContent = false;
    public contentData = [];
    public allForeignObjectDom: any = [];
    public contentBoxWidth = 20;
    public contentBoxHeight = 23;
    public content = '请输入证书的内容';
    public _index: number;
    public contentActiveData: any;
    public switchValue = false;

    constructor(
        private fileService: FileService,
        private notification: NzNotificationService,
        private http: Http,
    ) {
        this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
            this.ossPath = path;
        });
    }

    ngOnInit() {
    }

    /***** 详情 ******/
    public detailSvgDom() {
        setTimeout(() => {
            this.picture = this.detailParams.picture;
            const dom = new DOMParser().parseFromString(this.detailParams.template, 'image/svg+xml');

            let width = dom.getElementById('svg').style.width;
            let height = dom.getElementById('svg').style.height;
            this.width = parseFloat(width);
            this.proportion = parseFloat(height) / this.width;

            dom.getElementsByTagName('image')[0].setAttribute('xlink:href', this.ossPath + this.picture);
            document.getElementsByClassName('svg-box')[0].innerHTML = new XMLSerializer().serializeToString(dom);

            this.addEvent();
            this.contentBoxAddEvent();
        })
    }

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
            this.picture = urls[0];
            this.setWH();
            this.contentData = [];
            this.isSetting = true;
            this.isShowContent = false;
            this.UploadLoading = false;
        }).catch(() => {
            this.UploadLoading = false;
        });
    }

    public setWH() {
        const imgDate = new Image();
        imgDate.src = this.ossPath + this.picture;
        imgDate.onload = () => {
            this.width = 1000;
            const W = imgDate.width;
            const H = imgDate.height;
            this.proportion = H / W;

            if (W > this.width) {
                this.height = this.width * (H / W);
            } else {
                this.width = W;
                this.height = W * (H / W);
            }
        }
        document.getElementById('svgImage').setAttribute('xlink:href', this.ossPath + this.picture);
    }

    private setAttribute(element, option = {}) {
        Object.keys(option).forEach(key => {
            element.setAttribute(key, option[key]);
        });
        return element;
    }

    public setting() {
        if (this.allTextDom.length > 0 || this.allForeignObjectDom.length > 0) {
            this.isSetting = true;
        }
    }

    /**
     * 改变宽度
     * @param width 改变的值
     */
    public widthChange(width) {
        if (width >= 100 || width <= 1000) {
            this.height = width * this.proportion;
            if (this.detailParams.id) {
                document.getElementById('svg').style.width = width + 'px';
                document.getElementById('svg').style.height = this.height + 'px';

                document.getElementById('svgImage').style.width = width + 'px';
                document.getElementById('svgImage').style.height = this.height + 'px';
            }
        }
    }

    // 添加文字
    public addText() {
        if (!this.picture) {
            this.notification.info('提示信息', '请上传一张模板图');
            return;
        }
        this.insertText();
        this.addEvent();
    }

    public insertText() {
        let element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const textDom = this.setAttribute(element, {
            x: "5%",
            y: "5%",
            _tag: "text",
            "font-weight": '500',
            "text-anchor": "middle",
            "dominant-baseline": "middle",
			"font-size": this.font,
        });
        textDom.innerHTML = this.text;
        document.getElementById('svg').appendChild(textDom);
    }

    public addEvent() {
        this.allTextDom = document.querySelectorAll('#svg>text');
        if (this.allTextDom.length) {
            for (let index = 0; index < this.allTextDom.length; index++) {
                this.allTextDom[index].addEventListener('click', () => {
                    this.setStyle(index);
                    this.getTextActiveData();
                })
            }
        }
    }

    private getTextActiveData() {
        this.textActiveData = {
            text: this.allTextDom[this.elIndex].innerHTML,
            font: this.allTextDom[this.elIndex].getAttribute('font-size'),
            fill: this.allTextDom[this.elIndex].getAttribute('fill')
        };        
    }

    /**
     * 数据字段设置
     * @param event
     */
    public setTextActiveData(event: string) {
        this.dataList.forEach(item => {
            if (item.value == event) {
                this.textActiveData.text = item.label;
                this.allTextDom[this.elIndex].innerHTML = item.label;
            }
        });
        this.allTextDom[this.elIndex].setAttribute('_field', event);
    }

    /**
     * 设置文字样式
     * @param index 下标
     */
    public setStyle(index: number) {
        this.leftPrice = 5;
        this.topPrice = 5;
        this.elIndex = index;
        this.getLocation('text');
        this.clearTextActiveData();
        this.isSetting = false;
        this.isShowContent = false;
    }

    public clearTextActiveData() {
        if (!this.allTextDom[this.elIndex].getAttribute('_field')) {
            this.selectedValue = null;
        } else {
            this.selectedValue = this.allTextDom[this.elIndex].getAttribute('_field');
        }
    }

    public textChange(data) {
        this.allTextDom[this.elIndex].innerHTML = data;
    }

    public fontSizeChange(font: string) {
        this.allTextDom[this.elIndex].setAttribute('font-size', font + 'px');
    }

    public textColorChange(event: string) {
        this.allTextDom[this.elIndex].setAttribute('fill', event);
    }

    /**
     * x改变
     * @param left 距离左边的距离
     */
    public leftPriceChange(left: number) {
        this.allTextDom[this.elIndex].setAttribute('x', left + '%');
    }

    /**
     * y改变
     * @param top 距离上边的距离
     */
    public topPriceChange(top: number) {
        this.allTextDom[this.elIndex].setAttribute('y', top + '%');
    }

    // 删除
    public remove() {
        document.querySelector('#svg').removeChild(this.allTextDom[this.elIndex]);
        this.isSetting = true;
    }

    /********* 证书内容设置 **********/
    public addContent() {
        if (!this.picture) {
            this.notification.info('提示信息', '请上传一张模板图');
            return;
        }
        this.foreignObjectDom();
        this.contentBoxAddEvent();
    }

    public foreignObjectDom() {
        let element = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
        const newElement = this.setAttribute(element, {
            height: this.contentBoxHeight + 'px',
            width: this.contentBoxWidth + '%',
            "font-size": this.font,
            color: "#000",
            x: "0%",
            y: "0%"
		});
		newElement.style.lineHeight = 'initial';
        newElement.innerHTML = `<xhtml:div xmlns:xhtml="http://www.w3.org/1999/xhtml">${this.content}</xhtml:div>`
        document.getElementById('svg').appendChild(newElement);
    }

    public contentBoxAddEvent() {
        this.allForeignObjectDom = document.querySelectorAll('#svg>foreignObject');
        if (this.allForeignObjectDom.length) {
            for (let index = 0; index < this.allForeignObjectDom.length; index++) {
                this.allForeignObjectDom[index].addEventListener('click', () => {
                    this.setContentStyle(index);
                    this.getContentActiveData();
                })
            }
        }
    }

    /**
     * 获取选中的内容属性数据
     */
    private getContentActiveData() {
        this.contentActiveData = {
            content: this.allForeignObjectDom[this._index].getElementsByTagName('xhtml:div')[0].innerHTML,
            font: this.allForeignObjectDom[this._index].getAttribute('font-size'),
            color: this.allForeignObjectDom[this._index].getAttribute('color'),
            width: this.allForeignObjectDom[this._index].getAttribute('width').slice(0,-1)
        }
    }

    /**
     * 设置foreignObject盒子的样式
     * @param data 当前点击的项的数据
     * @param index 当前的索引值
     */
    public setContentStyle(index) {
        // this.contentActiveData = data;
        this._index = index;
        this.getLocation('content');
        this.isSetting = false;
        this.isShowContent = true;
    }

    public contentChange(event) {
		this.allForeignObjectDom[this._index].getElementsByTagName('xhtml:div')[0].innerHTML = event;
		this.getXhtmlDivH();
    }

    private getXhtmlDivH() {
        const height = this.allForeignObjectDom[this._index].children[0].offsetHeight;
        this.allForeignObjectDom[this._index].setAttribute('height', height + 'px');
    }

    /**
     * 改变内容的字号
     * @param font: number
     */
    public contentFontChange(font: number) {
        this.allForeignObjectDom[this._index].setAttribute('font-size', font + 'px');
        this.getXhtmlDivH();
    }

    // 改变颜色
    public contentColorChange(event) {
        this.allForeignObjectDom[this._index].setAttribute('color', event);
    }

    /**
     * 内容文本盒子的宽度格式，百分比
     * @param value
     */
    public formatterPercent = (value: number) => `${value} %`;

    public parserPercent = (value: string) => value.replace(' %', '');

    /**
     * 改变内容文本盒子的宽度
     * @param value
     */
    public contentBoxWidthChange(value) {
        this.allForeignObjectDom[this._index].setAttribute('width', value + '%');
        this.getXhtmlDivH();
    }

    /**
     * 是否开启辅助线条
     * @param event
     */
    public switchChange(event) {
        let el = document.getElementsByTagName('foreignObject');
        for (let i = 0; i < el.length; i++) {
            if (event) {
                el[i].style.border = '1px dashed #000';
            } else {
                el[i].style.border = null;
            }
        }
	}
	
	/**
	 * 取消辅助线条
	 */
	public cancelLinellae() {
        let el = document.getElementsByTagName('foreignObject');
        console.log(el);
		for (let i = 0; i < el.length; i++) {            
            el[i].style.border = null;
		}
	}

    public xValueChange(left) {
        this.allForeignObjectDom[this._index].setAttribute('x', left + '%');
    }

    public yValueChange(top) {
        this.allForeignObjectDom[this._index].setAttribute('y', top + '%');
    }

	// 删除选中当前的内容
    public contentRemove() {
        document.querySelector('#svg').removeChild(this.allForeignObjectDom[this._index]);
        this.isSetting = true;
        this.isShowContent = false;
    }

    /**
     * 获取初始的x,Y值
     * @param type
     */
    private getLocation(type) {
        if (type == 'text') {
            let x = this.allTextDom[this.elIndex].getAttribute('x');
            let y = this.allTextDom[this.elIndex].getAttribute('y');
            this.leftPrice = parseFloat(x.slice(0, -1));
            this.topPrice = parseFloat(y.slice(0, -1));
        } else if (type == 'content') {
            let x = this.allForeignObjectDom[this._index].getAttribute('x');
            let y = this.allForeignObjectDom[this._index].getAttribute('y');
            this.leftPrice = parseFloat(x.slice(0, -1));
            this.topPrice = parseFloat(y.slice(0, -1));
        }
    }

    /**
     * 边距规格 可以为1、0.1
     * @param activeItem 选中当前项
     */
    public tagCheckChange(activeItem) {
        this.sizeRange.forEach(item => {
            item.checked = false;
            if (item.label == activeItem.label) {
                item.checked = true;
                this.setp = item.label;
            }
        })
    }

    // 清除相关数据
    public clear() {
        this.picture = null;
        this.contentData = [];
        this.width = 1000;
        this.height = null;
        this.isSetting = true;
        this.isShowContent = false;

        this.sizeRange = [
            { label: '1.0', checked: true },
            { label: '0.1', checked: false },
        ]
    }

}
