import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import ProgramOptionType from "./programOptionTypeModel";
export default class ProgramOptionTypeMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ProgramOptionType;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            programOptionTypeId: seededChance.guid(),
            type: seededChance.word(),
            _programOptions: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ProgramOptionType {
        return <ProgramOptionType> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ProgramOptionType[] {
        return <ProgramOptionType[]>new this().buildCollection(count, overrides, exists);
    }

}

