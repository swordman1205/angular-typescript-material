import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import CountryStates from "./countryStatesModel";

export default class CountryStatesMock extends AbstractMock {

    public getModelClass():IModelClass {
        return CountryStates;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            country: seededChance.word(),
            states: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):CountryStates {
        return <CountryStates> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):CountryStates[] {
        return <CountryStates[]>new this().buildCollection(count, overrides, exists);
    }

}

