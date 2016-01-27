import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import ZuoraPaymentMethod from "./zuoraPaymentMethodModel";
export default class ZuoraPaymentMethodMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ZuoraPaymentMethod;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            Id: seededChance.guid().replace(/-/g, ''),
            CreditCardExpirationMonth: seededChance.integer({min: 1, max: 12}),
            CreditCardExpirationYear: seededChance.integer({min: 2016, max: 2100}),
            CreditCardHolderName: seededChance.name(),
            CreditCardMaskNumber: seededChance.cc(),
            CreditCardType: seededChance.cc_type(),
            PaymentMethodStatus: seededChance.pick(['Active']),
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ZuoraPaymentMethod {
        return <ZuoraPaymentMethod> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ZuoraPaymentMethod[] {
        return <ZuoraPaymentMethod[]>new this().buildCollection(count, overrides, exists);
    }

}
