import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import ZuoraInvoice from "./zuoraInvoiceModel";
import momentDate from "../../libs/moment/momentDate";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export default class ZuoraInvoiceMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ZuoraInvoice;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            Id: seededChance.guid().replace(/-/g, ''),
            AccountId: seededChance.guid().replace(/-/g, ''),
            AdjustmentAmount: seededChance.integer({min: 0, max: 200}),
            Amount: seededChance.integer({min: 0, max: 200}),
            AmountWithoutTax: seededChance.integer({min: 0, max: 200}),
            Balance: seededChance.integer({min: 0, max: 200}),
            CreatedById: seededChance.guid().replace(/-/g, ''),
            CreatedDate: moment().subtract(seededChance.integer({min: 1, max: 31}), 'd'),
            CreditBalanceAdjustmentAmount: seededChance.integer({min: 0, max: 200}),
            DueDate: momentDate().subtract(seededChance.integer({min: 1, max: 31}), 'd'),
            IncludesOneTime: seededChance.bool(),
            IncludesRecurring: seededChance.bool(),
            IncludesUsage: seededChance.bool(),
            InvoiceDate: momentDate().subtract(seededChance.integer({min: 1, max: 31}), 'd'),
            InvoiceNumber: seededChance.guid().replace(/-/g, ''),
            PaymentAmount: seededChance.integer({min: 0, max: 200}),
            PostedBy: seededChance.guid().replace(/-/g, ''),
            PostedDate: moment().subtract(seededChance.integer({min: 1, max: 31}), 'd'),
            RefundAmount: seededChance.integer({min: 0, max: 200}),
            Status: seededChance.pick(['paid']),
            TargetDate: momentDate().subtract(seededChance.integer({min: 1, max: 31}), 'd'),
            TaxAmount: seededChance.integer({min: 0, max: 200}),
            TaxExemptAmount: seededChance.integer({min: 0, max: 200}),
            UpdatedDate: moment(),
        }

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ZuoraInvoice {
        return <ZuoraInvoice> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ZuoraInvoice[] {
        return <ZuoraInvoice[]>new this().buildCollection(count, overrides, exists);
    }

}
