import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import State from "./stateModel";

export default class StateMock extends AbstractMock {

    public getModelClass():IModelClass {
        return State;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            code: seededChance.word(),
            name: seededChance.word()
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):State {
        return <State> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):State[] {
        return <State[]>new this().buildCollection(count, overrides, exists);
    }

}

