import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Direction from "./directionModel";
export default class DirectionMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Direction;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            directionId: seededChance.guid(),
            numbered: seededChance.bool(),
            content: seededChance.sentence()
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Direction {
        return <Direction> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Direction[] {
        return <Direction[]>new this().buildCollection(count, overrides, exists);
    }

}

