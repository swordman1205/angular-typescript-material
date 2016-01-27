import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import ZuoraPaymentSignature from "./zuoraPaymentSignature";
export default class ZuoraPaymentSignatureMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ZuoraPaymentSignature;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            key: seededChance.sentence(),
            signature: seededChance.sentence(),
            token: seededChance.guid().replace(/-/g, ''),
            tenantId: seededChance.integer({min: 0, max: 100000}),
            success: seededChance.bool()
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ZuoraPaymentSignature {
        return <ZuoraPaymentSignature> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ZuoraPaymentSignature[] {
        return <ZuoraPaymentSignature[]>new this().buildCollection(count, overrides, exists);
    }

}

