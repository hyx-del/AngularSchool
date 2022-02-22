import { Component, OnInit, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { NzModalService, NzNotificationService } from 'ng-zorro-antd';
import { Http } from '@yilu-tech/ny';
import { Config } from '@/config';
import { FileService } from '@/providers/index';
import * as dayjs from 'dayjs';

@Component({
	selector: 'sign-detail',
	templateUrl: './sign-detail.component.html',
	styleUrls: ['./sign-detail.component.scss']
})
export class SignDetailComponent implements OnInit, OnChanges {
	@Input() visible;

	@Input() detailData: any;

    @Output() visibleChange = new EventEmitter();
    
    // tab 
    public coatsAdjustRecord = null;

    public paymentRecord = null;
    
    public transferSchool = null;

	isShowPay = false;

	isShowMoney = false;

	params: any = {};

	collection: any = {};

    payCollection: any = {};
    
    transferSchoolList: any = {};

	form: nyForm;

	moneyform: nyForm;

	public signDetail: any = {};

	public checkOptions = [];

	public payOptions = [];

	public arrays = [];

	public paid = {};

	public ossPath: string;

    // public paymentOptions: Array<any> = [
	// 	{ name: "富有二维码", id: 150 },
	// 	{ name: "富有POS机", id: 160 },
	// 	{ name: "银联POS机", id: 170 },
	// 	{ name: "银联二维码", id: 180 },
	// 	{ name: "青橙后台", id: 190 },
	// 	{ name: "现金", id: 110 },
	// 	{ name: "余额", id: 120 },
	// ];

    public paymentOptions: Array<any> = [];

	public payInfo: Array<any> = [{}];

    public payment: any = {};
    
    public isPaySuccess = false;

    public salesmanList: any[] = [];
    isLoadingSalesman: boolean = false;

	constructor(
		private modalService: NzModalService,
		private notification: NzNotificationService,
		private http: Http,
		private fileService: FileService,
	) {
		this.fileService.getBucketInfo(Config.buckets.admin).then((path: string) => {
			this.ossPath = path;
		})
	}

	ngOnInit() {

    }
    
    // tab切换
    tabChange(event) {        
        if (event.index == 1 && !this.coatsAdjustRecord) {
            this.coatsAdjustRecord = 'school/teaching-school/semester-coats-adjust/list';
        }else if (event.index == 2 && !this.paymentRecord) {
            this.paymentRecord = 'school/teaching-school/payment-order/list';
        }else if (event.index == 3 && !this.transferSchool) {
            this.transferSchool = 'school/teaching-school/transfer-school/record-list';
        }
    }

	checkedChange() {
		let total = 0;
		this.arrays.forEach(item => {
			if (item.checked) {
				total += parseFloat(item.value);
				this.params.actual_total = total.toFixed(2);
			}
		});
		if (total == 0) {
			this.params.actual_total = total;
		}
	}


	//尾款
	public tuitionChange(item) {
		item.params[0].tuition = item.value;
		this.checkedChange();
	}

	public setCollection(collection: any) {
		this.collection = collection;
	}

	public getCollection(payCollection: any) {
		this.payCollection = payCollection;
    }
    
    // 转校记录
    public setTransferSchoolList(collection) {
        this.transferSchoolList = collection;
    }

	ngOnChanges(val: SimpleChanges) {
		if (val.visible && val.visible.currentValue) {
			this.getDetail();
		}
	}

	cancel() {
		this.images = {
			front: null,
			reverse: null,
        };
        this.coatsAdjustRecord = null;
        this.paymentRecord = null;
        this.transferSchool = null;
		this.signDetail = {};
		this.visibleChange.emit(false);
	}

	public images: any = {
		front: null,
		reverse: null,
	};

	public getDetail() {
		this.http.get("school/teaching-school/student-semester/detail?id=" + this.detailData.id).then(ret => {
            if (ret.is_meal_status == 1) {
                ret.isMealStatus = true;
            } else {
                ret.isMealStatus = false;
            }

            if (ret.salesman_id) {
                Array.isArray("")
                if (Array.isArray(ret.salesman_id)) {
                    ret.salesman_id = ret.salesman_id.map(item => parseInt(item));
                } else {
                    ret.salesman_id = [parseInt(ret.salesman_id)];
                }
            }
            this.signDetail = ret;
            if (ret.id_card_images) {
                this.images = {
                    front: ret.id_card_images.front,
                    reverse: ret.id_card_images.reverse
                }
            }
		})
        if (!this.salesmanList.length && this.isLoadingSalesman == false) {
            this.getSalesmanList();   
        }
        if (!this.paymentOptions.length) {
            this.getPaymentMode();
        }
	}

    public getSalesmanList() {
        this.http.get("staff/manage/getTrainingSalesmanList").then(ret => {
            this.salesmanList = ret || [];
            this.isLoadingSalesman = true;
        });
    }

    getPaymentMode() {
        this.http.post("school/teaching/payment-mode/get-list", { status: 1 }).then(ret => {
            this.paymentOptions = ret || [];
        })
    }

	public indexs: number;


	/****************付款  Modal***********/
	// 付款、退款按钮
	public payIndex: any;
    currentPaymentDate: string = "";

	public pay(index: any) {
		if (index == -10) {
			this.refundElementData();
			this.arrays = this.payOptions.filter(item => item.value > 0);
		}
		if (index == 10) {
			this.paymentElementData();
			this.arrays = this.checkOptions.filter(item => item.value > 0);
		}
        this.currentPaymentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
        this.payment = { updated_at: this.currentPaymentDate };
        this.payInfo = [{ ...this.payment }];
		this.isShowPay = true;
		this.params = {
			total_price_not_paying: this.signDetail.total_price_not_paying,
			balance_payment: this.signDetail.balance_payment,
			payment_order_type: 10,
			actual_total: 0,
		}
		this.form.clearError();
		this.payIndex = index
	}

	// 付款布局数据
	private paymentElementData() {
		const data = this.signDetail;
		this.checkOptions = [
			{ 
                label: '培训费', 
                value: data.to_paid_tuition, 
                checked: false, 
                params: [{ tuition: data.to_paid_tuition }] 
            },
			{ 
                label: '押金', 
                value: data.to_paid_deposit, 
                checked: false, 
                params: [{ deposit: this.signDetail.to_paid_deposit }] 
            },
            { 
                label: '定金', 
                value: data.to_paid_earnest, 
                checked: false, 
                params: [{ earnest: data.to_paid_earnest }]
            }
		];

		if (data.is_quarterage == 1) { // 学期提供住宿 需要支付住宿费
			const to_paid_quarterage = { 
                label: '住宿费', 
                value: data.to_paid_quarterage, 
                checked: false,
				params: [{ quarterage: data.to_paid_quarterage }]
			}
			this.checkOptions.push(to_paid_quarterage);
		}
        if (data.is_meal_status == 1) {
            this.checkOptions.push({
                label: "餐费",
                value: data.to_paid_meal_money,
                checked: false,
				params: [{ meal_money: data.to_paid_meal_money }]
            });
        }
        
	}

	// 退款布局数据
	private refundElementData() {
		let paidtui = this.signDetail.tuition_paid; // 已付学费
		let moneyPaid = this.signDetail.money_paid; // 已付住宿费
		let padidep = this.signDetail.deposit_paid; // 已付押金
		let earnest_paid = this.signDetail.earnest_paid; // 已付定金
		let meal_money = this.signDetail.meal_money_paid || 0; // 已付餐费

		this.payOptions = [
			{ label: '培训费', value: paidtui, checked: false, params: [{ tuition: paidtui }] },
			{ label: '住宿费', value: moneyPaid, checked: false, params: [{ quarterage: moneyPaid }] },
			{ label: '押金', value: padidep, checked: false, params: [{ deposit: padidep }] },
			{ label: '定金', value: earnest_paid, checked: false, params: [{ earnest: earnest_paid }] },
			{ label: '餐费', value: meal_money, checked: false, params: [{ meal_money: meal_money }] },
		];
	}

	//关闭付款、退款Modal
	public handleCancel() {        
        this.isShowPay = false;
        this.isPaySuccess = false;
		this.paid = {};
		this.payInfo = [{}];
		this.payment = {};
		Object.keys(this.arrays).forEach(item => {
			this.arrays[item].checked = false;
		});
	}

	public handleOk() {
		this.arrays.forEach(item => {
			if (item.checked) {					
				this.paid = { ...this.paid, ...item.params[0] }
			}
		});

		if (!Object.keys(this.paid).length) {
			this.notification.info('提示信息', `请勾选${this.payIndex == 10 ? '付款' : '退款'}项`);
			return;
		}
        
        this.isPaySuccess = true;
		if (this.payIndex == 10) {
			this.form.action = "school/teaching-school/order/create";
		}

		if (this.payIndex == -10) {
			this.form.action = "school/teaching-school/order/refund";
		}

		this.form.submit().then(ret => {
			this.notification.success("提示信息", `${this.payIndex == 10 ? '付款成功' : '退款成功'}`);
			this.getDetail();
			this.handleCancel();
		}).catch(error => {
            this.paid = {};
            this.isPaySuccess = false;
		})
	}

	//付款、退款按钮表单
	onFormInit(form: any) {
		const bodyS = [
			'student_id', // 学生id
			'semester_id', // 学期id
			'register_mode', // 付款模式
			'to_paid_tuition', // 待付学费
			'tuition_paid', // 已付学费
			'deposit_paid', // 已付押金
			'money_paid', //已付住宿费
			'to_paid_quarterage',  //待付住宿费
			'is_contain_quarterage', // 是否包含住宿
		];

		this.form.request = this.http.request.bind(this.http);
		this.form.onSubmit = (body) => {
			for (const key of bodyS) {				
				body[key] = this.signDetail[key];
			}
            if (this.signDetail.id) {
                body.id = this.signDetail.id;
            }

			body.platform = 10;//下单渠道 后台
			body.type = this.payIndex;// 下单类型 10为付款，-10为退款
			body.actual_total = this.params.actual_total; // 实际金额
			body.payment_order_type = this.params.payment_order_type; // 支付类型
			body.paid = this.paid; // 支付费用集合
			
			if (this.params.payment_order_type == 10) {
				let price = this.params.actual_total === 0 ? 0 : this.params.actual_total;
                let payment = Object.assign({}, this.payment);
                if (payment.updated_at) {
                    payment.updated_at = dayjs(payment.updated_at).format("YYYY-MM-DD HH:mm:ss");
                }
				body.payment_order = [{ amount: price || 0, ...payment }];
			} else {
				body.payment_order = this.payInfo.filter(pay => pay.channel && pay.amount).map(item => {
                    if (item.updated_at) {
                        item.updated_at = dayjs(item.updated_at).format("YYYY-MM-DD HH:mm:ss");
                    }
                    return item;
                });
			}

		}
	}

	/****************费用调整 Modal***********/
	//调整按钮      10定金 20学费 30住宿费 40押金
	changeButton(index: any) {
		this.isShowMoney = true;
		this.indexs = index;
	}

	public costAdjustmentcancel() {
		this.isShowMoney = false;
		this.moneyform.clearError();
		this.moneyform.body = {};
	}

	public costChanges() {
		this.moneyform.action = "school/teaching-school/semester-coats-adjust/create";
		this.moneyform.submit().then(ret => {
			this.notification.success("提示信息", "调整成功");
			this.isShowMoney = false;
			this.costAdjustmentcancel();
			this.getDetail();
		});
	}

	//学费调整表单
	moneyForm(form: any) {
		this.moneyform.request = this.http.request.bind(this.http);
		this.moneyform.onSubmit = (body) => {
			body.semester_id = this.signDetail.semester_id;
			if (this.indexs == 20) {
				body.old_money = this.signDetail.tuition;
			} else {
				body.old_money = this.signDetail.quarterage;
            }
			body.type = this.indexs;
			body.id = this.signDetail.id;
			body.register_mode = this.signDetail.register_mode;
			body.is_contain_quarterage = this.signDetail.is_contain_quarterage;
			body.earnest = this.signDetail.earnest;
			body.quarterage = this.signDetail.quarterage;
			body.tuition = this.signDetail.tuition;
			body.tuition_paid = this.signDetail.tuition_paid;
			body.money_paid = this.signDetail.money_paid;
		}
	}

	/****************付款记录 Modal***********/
	addPaymentInfo() {
		this.payInfo.push({ updated_at: this.currentPaymentDate });
	}

	removePaymentInfo(index) {
		this.payInfo.splice(index, 1);
    }
    

    async quarteragChange(ev) {
        let is_quarterage = ev ? 1 : 0;
        let is_meal_status = this.signDetail.isMealStatus ? 1 : -1;
        
        let params = {
            id: this.detailData.id,
            is_meal_status,
            is_quarterage: is_quarterage,
        };
        this.http.post("school/teaching-school/student-semester/update", params).then(ret => {
            this.notification.success('提示信息', '修改成功');
            this.getDetail();
        })
    }
    
    // 销售修改记录
    salesmanRecordCollection: any = {};
    updateSalesmanIds = [];
    updateSalesmanVisible: boolean = false;

    setSalesmanRecordCollection(collection: any) {
        this.salesmanRecordCollection = collection;
    }

    showUpdateSalesman() {
        this.updateSalesmanIds = this.signDetail.salesman_id || [];
        this.updateSalesmanVisible = true;
    }

    closeSalemanModal() {
        this.updateSalesmanVisible = false;
    }

    saveSalesman() {
        let params = {
            id: this.signDetail.id,
            new_salesman_id: this.updateSalesmanIds || [],
        }
        this.http.post("school/teaching-school/student-semester/update-salesman", params).then(ret => {
            this.notification.success("提示信息", "修改成功");
            this.signDetail.salesman_id = this.updateSalesmanIds;
            this.closeSalemanModal();
        })
    }
    
    mealStatusChange() {
        let is_meal_status = this.signDetail.isMealStatus ? 1 : -1;
        let params = {
            id: this.detailData.id,
            is_meal_status,
            is_quarterage: this.signDetail.is_quarterage,
        };
        this.http.post("school/teaching-school/student-semester/update", params).then(ret => {
            this.notification.success('提示信息', '修改成功');
            this.getDetail();
        })
    }


    commissionAdjustVisible: boolean = false;
    adjustVisible: boolean = false;
    adjustType: number;
    adjustTitle: string = "";
    adjustParams: any = {};

    showCommissionAdjust() {
        this.commissionAdjustVisible = true;
    }

    // 提成调整
    commissionAdjust() {
        if (!this.adjustParams.push_money) {
            this.notification.info("提示信息", "请输入调整后计入提成");
            return ;
        }
        let params: any = {
            type: 50,
        };
        let bodyKeys = ["id", "semester_id", "register_mode", "is_contain_quarterage", "earnest", "quarterage", "tuition", "tuition_paid", "money_paid"];

        bodyKeys.forEach(key => {
            params[key] = this.signDetail[key];
        });

        params.old_money = this.signDetail.push_money;
        params.new_money = this.adjustParams.push_money;
        params.remark = this.adjustParams.remark || "";

        this.http.post("school/teaching-school/semester-coats-adjust/create", params).then(ret => {
            this.notification.success('提示信息', '调整成功');
            this.commissionAdjustVisible = false;
            this.adjustParams = {};
            this.getDetail();
        });
    }

    // const EARNEST = 10; //定金
    // const TUITION = 20; //学费
    // const QUARTERAGE = 30;  //住宿费
    // const DEPOSIT = 40; //押金
    // const DEDUCT = 50; //提成
    // const MEAL_MONEY = 60; //餐费金额

    showAdjustModel(type: number) {
        this.adjustType = type;
        let money;
        if (type == 10) {
            money = this.signDetail.earnest;
            this.adjustTitle = "定金调整";
        } else if (type == 40) {
            money = this.signDetail.deposit;
            this.adjustTitle = "押金调整";
        } else if (type == 60) {
            money = this.signDetail.meal_money;
            this.adjustTitle = "餐费调整";
        }

        this.adjustParams = { old_money: money };
        this.adjustVisible = true;
    }

    confirmAdjust() {
        if (!this.adjustParams.new_money) {
            this.notification.info("提示信息", "请输入调整费用");
            return ;
        }
        let params: any = {
            type: this.adjustType,
        };
        
        let bodyKeys = ["id", "semester_id", "register_mode", "is_contain_quarterage", "earnest", "quarterage", "tuition", "tuition_paid", "money_paid"];

        bodyKeys.forEach(key => {
            params[key] = this.signDetail[key];
        });

        params.old_money = this.adjustParams.old_money;
        params.new_money = this.adjustParams.new_money;
        params.remark = this.adjustParams.remark || "";

        this.http.post("school/teaching-school/semester-coats-adjust/create", params).then(ret => {
            this.notification.success('提示信息', '调整成功');
            this.adjustParams = {};
            this.adjustVisible = false;
            this.getDetail();
        });
    }

}
