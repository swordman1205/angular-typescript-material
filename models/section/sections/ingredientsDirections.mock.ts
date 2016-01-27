import {AbstractMock} from "../../abstractModel.mock";
import {IModelClass} from "../../abstractModel";
import IngredientsDirections from "./ingredientsDirections";
export default class IngredientsDirectionsMock extends AbstractMock {

    public getModelClass():IModelClass {
        return IngredientsDirections;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {};
    }

    public static entity(overrides:Object = {}, exists:boolean = true):IngredientsDirections {
        return <IngredientsDirections> new this().buildEntity(overrides, exists);
    }

}

