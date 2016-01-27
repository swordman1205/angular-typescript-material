import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Program from "./programModel";
export default class ProgramMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Program;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            programId: seededChance.guid(),
            programKey: chance.word({syllables: 3}),
            name: seededChance.word(),
            periodCount: seededChance.integer({min: 2, max: 12}),
            periodLength: seededChance.integer({min: 1, max: 7}),
            periodName: seededChance.word(),
            description: seededChance.paragraph(),
            logoImageId: seededChance.guid(),
            bannerImageId: seededChance.guid(),
            _tags: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Program {
        return <Program> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Program[] {
        return <Program[]>new this().buildCollection(count, overrides, exists);
    }

}

