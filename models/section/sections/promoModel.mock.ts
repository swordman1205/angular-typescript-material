import {AbstractMock} from "../../abstractModel.mock";
import {IModelClass} from "../../abstractModel";
import Promo from "./promoModel";
export default class PromoMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Promo;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {};
    }

    public static entity(overrides:Object = {}, exists:boolean = true):Promo {
        return <Promo> new this().buildEntity(overrides, exists);
    }

}

