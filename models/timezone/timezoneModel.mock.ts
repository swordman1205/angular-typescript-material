import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Timezone from "./timezoneModel";

export default class TimezoneMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Timezone;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            timezoneIdentifier: seededChance.word(),
            offset: seededChance.integer({min: 0, max: 10000}),
            isDst: seededChance.bool(),
            displayOffset: seededChance.pick(['+05:13', '-04:12'])
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Timezone {
        return <Timezone> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Timezone[] {
        return <Timezone[]>new this().buildCollection(count, overrides, exists);
    }

}

