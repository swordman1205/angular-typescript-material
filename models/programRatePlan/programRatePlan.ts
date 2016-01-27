import * as _ from "lodash";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";

export type ProgramRatePlanType = 'instalments'|'up-front';
export type ProgramRatePlanPeriodType = 'Week';

export default class ProgramRatePlan extends AbstractModel {

    public static TYPE_INSTALLMENTS:ProgramRatePlanType = 'instalments';
    public static TYPE_UP_FRONT:ProgramRatePlanType = 'up-front';
    public static PERIOD_TYPE_WEEK:ProgramRatePlanPeriodType = 'Week';

    protected __primaryKey = 'ratePlanId';

    protected __nestedEntityMap:INestedEntityMap = {
        _currencyAmounts: ProgramRatePlanCurrencyAmount
    };

    protected __attributeCastMap:IAttributeCastMap = {
        ratePlanPurchaseable: this.castBoolean,
    };

    public ratePlanId:string;
    public ratePlanName:string;
    public ratePlanDescription:string;
    public ratePlanBadgeTitle:string;
    public ratePlanPurchaseable:boolean;
    public type:ProgramRatePlanType;
    public recurringPeriodType:ProgramRatePlanPeriodType;
    public recurringCount:number;
    public ratePlanSortOrder:number;

    public _currencyAmounts:ProgramRatePlanCurrencyAmount[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public getCurrencyAmount(currencyType:string):ProgramRatePlanCurrencyAmount {
        return _.find(this._currencyAmounts, {currency: currencyType});
    }

}

export class ProgramRatePlanCurrencyAmount extends AbstractModel {

    public currency:string;
    public oneTimeCharge:number;
    public oneTimeChargeId:string;
    public oneTimeChargeTierId:string;
    public recurringCharge:number;
    public recurringChargeId:string;
    public recurringChargeTierId:string;

}




