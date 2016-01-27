import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Country from "./countryModel";

export default class CountryMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Country;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            countryName: seededChance.word(),
            countryCode: seededChance.word(),
            timezones: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Country {
        return <Country> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Country[] {
        return <Country[]>new this().buildCollection(count, overrides, exists);
    }

}

