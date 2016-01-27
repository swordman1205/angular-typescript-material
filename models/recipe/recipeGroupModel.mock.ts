import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import RecipeGroup from "./recipeGroupModel";
export default class RecipeGroupMock extends AbstractMock {

    public getModelClass():IModelClass {
        return RecipeGroup;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            groupId: seededChance.guid(),
            name: seededChance.word(),
            recipeId: null,
            entityOrder: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):RecipeGroup {
        return <RecipeGroup> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):RecipeGroup[] {
        return <RecipeGroup[]>new this().buildCollection(count, overrides, exists);
    }

}

