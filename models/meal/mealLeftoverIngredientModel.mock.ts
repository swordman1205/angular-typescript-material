import {IModelClass} from "../abstractModel";
import IngredientMock from "../ingredient/ingredientModel.mock";
import MealLeftoverIngredient from "./mealLeftoverIngredientModel";
import MealLeftoverIngredientPivot from "./mealLeftoverIngredientModel";

export default class MealLeftoverIngredientMock extends IngredientMock {

    public getModelClass():IModelClass {
        return MealLeftoverIngredient;
    }

    public getMockData():Object {

        let seededChance:Chance.Chance = new Chance();

        let ingredientMockData = super.getMockData();

        let pivot = new MealLeftoverIngredientPivot({
            groupId: seededChance.guid(),
            recipeId: seededChance.guid()
        });

        ingredientMockData['_pivot'] = pivot;

        return ingredientMockData;

    }

    public static entity(overrides:Object = {}, exists:boolean = true):MealLeftoverIngredient {
        return <MealLeftoverIngredient> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):MealLeftoverIngredient[] {
        return <MealLeftoverIngredient[]>new this().buildCollection(count, overrides, exists);
    }

}

