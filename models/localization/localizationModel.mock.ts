import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Localization from "./localizationModel";
export default class LocalizationMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Localization;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            localizableId: seededChance.guid(),
            localizableType: null,
            localizations: {}, //@todo create a more useful localization mock
            regionCode: 'uk',
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Localization<any> {
        return <Localization<any>> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Localization<any>[] {
        return <Localization<any>[]>new this().buildCollection(count, overrides, exists);
    }

}

