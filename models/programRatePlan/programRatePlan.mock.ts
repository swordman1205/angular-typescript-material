import {IModelClass} from "../abstractModel";
import {AbstractMock} from "../abstractModel.mock";
import ProgramRatePlan, {ProgramRatePlanCurrencyAmount} from "./programRatePlan";
export default class ProgramRatePlanMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ProgramRatePlan;
    }

    public getMockData():Object {

        let seededChance:Chance.Chance = new Chance();

        return {
            ratePlanId: seededChance.guid().replace(/-/g, ''),
            ratePlanName: seededChance.word(),
            ratePlanDescription: seededChance.sentence(),
            ratePlanBadgeTitle: seededChance.word(),
            ratePlanPurchaseable: 'true',
            type: seededChance.pick([ProgramRatePlan.TYPE_INSTALLMENTS, ProgramRatePlan.TYPE_UP_FRONT]),
            recurringPeriodType: ProgramRatePlan.PERIOD_TYPE_WEEK,
            recurringCount: seededChance.integer({min: 1, max: 10}),
            ratePlanSortOrder: seededChance.integer({min: 1, max: 10}),
            _currencyAmounts: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ProgramRatePlan {
        return <ProgramRatePlan> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ProgramRatePlan[] {
        return <ProgramRatePlan[]>new this().buildCollection(count, overrides, exists);
    }

}

export class ProgramRatePlanCurrencyAmountMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ProgramRatePlanCurrencyAmount;
    }

    public getMockData():Object {

        let seededChance:Chance.Chance = new Chance();

        return {
            currency: seededChance.pick(['AUD', 'GBP', 'USD']),
            oneTimeCharge: seededChance.floating({fixed: 2, min: 50, max: 150}),
            oneTimeChargeId: seededChance.guid().replace(/-/g, ''),
            oneTimeChargeTierId: seededChance.guid().replace(/-/g, ''),
            recurringCharge: seededChance.floating({fixed: 2, min: 5, max: 15}),
            recurringChargeId: seededChance.guid().replace(/-/g, ''),
            recurringChargeTierId: seededChance.guid().replace(/-/g, '')
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ProgramRatePlanCurrencyAmount {
        return <ProgramRatePlanCurrencyAmount> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ProgramRatePlanCurrencyAmount[] {
        return <ProgramRatePlanCurrencyAmount[]>new this().buildCollection(count, overrides, exists);
    }

}