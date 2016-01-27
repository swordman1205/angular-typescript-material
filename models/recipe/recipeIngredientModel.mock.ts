import IngredientMock from "../ingredient/ingredientModel.mock";
import {IModelClass} from "../abstractModel";
import RecipeIngredient, {RecipeIngredientPivot} from "./recipeIngredientModel";
import Ingredient from "../ingredient/ingredientModel";

export default class RecipeIngredientMock extends IngredientMock {

    public getModelClass():IModelClass {
        return RecipeIngredient;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let ingredientMockData = super.getMockData();

        let pivot = new RecipeIngredientPivot({
            nameOverride: seededChance.bool() ? seededChance.word() : undefined,
            optional: seededChance.bool(),
            description: seededChance.sentence(),
            amount: seededChance.floating({min: 0, max: 100}),
            groupId: null,
        });

        let validOptions:string[];
        if (ingredientMockData['measuredBy'] == Ingredient.measuredByWeight) {
            validOptions = ['pinch', 'grams', 'kilograms'];
            if (ingredientMockData['cupSpoonMeasuresEnabled']) {
                validOptions = validOptions.concat(['cups', 'tablespoons', 'teaspoons']);
            }
            if (ingredientMockData['unitCountsEnabled']) {
                validOptions = validOptions.concat(['small', 'medium', 'large']);
            }
        }
        else {
            validOptions = ['drop', 'millilitres', 'litres', 'cups', 'tablespoons', 'teaspoons'];
        }

        pivot.amountType = seededChance.pick(validOptions);

        ingredientMockData['_pivot'] = pivot;

        return ingredientMockData;

    }

    public static entity(overrides:Object = {}, exists:boolean = true):RecipeIngredient {
        return <RecipeIngredient> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):RecipeIngredient[] {
        return <RecipeIngredient[]>new this().buildCollection(count, overrides, exists);
    }

}

