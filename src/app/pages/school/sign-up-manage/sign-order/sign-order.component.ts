import { Component, OnInit } from '@angular/core';
import { Http } from '@yilu-tech/ny'
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
@Component({
    selector: 'app-sign-order',
    templateUrl: './sign-order.component.html',
    styleUrls: ['./sign-order.component.scss']
})
export class SignOrderComponent implements OnInit {
    collection: any = {};
    isShowOrder: boolean = false;
    // 状态 0:未支付 8:支付中 10:支付成功 -10:支付失败
    statusList: any = {
        0: " 未支付",
        8: "支付中",
        10: "支付成功",
        '-10': "支付失败",
    }

    paymentOptions: any[] = [];

    constructor(private http: Http, private modalService: NzModalService, private notification: NzNotificationService) { }

    ngOnInit() {
        this.getPaymentMode();
    }

    getPaymentMode() {
        this.http.post("school/teaching/payment-mode/get-list").then(ret => {
            (ret || []).forEach(item => {
                this.payWayOptions[item.id] = item.name;
            });
        })
    }

    public setCollection(collection) {
        this.collection = collection;
        this.collection.onSetHeader = () => {
            this.collection.getHeader('id').click = (item) => this.detail(item);
        }
    }

    close() {
        this.isShowOrder = false;
    }
    public orderDetailList: any = [];
    public payOrder: any = [];
    public detailList: any = {};
    public payWayOptions = {
        10: "现金",
        20: "余额",
        30: "微信支付",
        40: "支付宝",
    };

    // public payWayOptions = {
    //     10: "现金",
    //     110: "现金",
    //     20: "余额",
    //     120: "余额",
    //     30: "微信支付",
    //     130: "微信支付",
    //     40: "支付宝",
    //     140: "支付宝",
    //     150: "富有二维码",
    //     160: "富有POS机",
    //     170: "银联POS机",
    //     180: "银联二维码",
    //     190: "青橙后台",
    // };
    public payTypeOptions = {
        10: "定金",
        20: "学费",
        30: "住宿费",
        40: "押金",
        50: '餐费'
    }
    //订单详情
    public detail(item: any) {
        this.http.get("school/teaching-school/order/detail", { id: item.id, semester_id: item.semester_id }).then((ret) => {
            this.detailList = ret;
            this.payOrder = ret.payment_order;
            this.orderDetailList = ret.order_item;
            this.isShowOrder = true;
        })
    }
    cancelOrder(item: any) {
        this.http.post("school/teaching-school/order/cancelled", { id: item.id }).then(() => {
            this.notification.success("提示信息", "取消成功");

        })
    }



}
