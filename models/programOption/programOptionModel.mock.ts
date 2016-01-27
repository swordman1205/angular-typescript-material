import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import ProgramOption from "./programOptionModel";
export default class ProgramOptionMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ProgramOption;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            programOptionId: seededChance.guid(),
            programOptionTypeId: seededChance.guid(),
            name: seededChance.word(),
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ProgramOption {
        return <ProgramOption> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ProgramOption[] {
        return <ProgramOption[]>new this().buildCollection(count, overrides, exists);
    }

}

