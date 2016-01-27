import * as _ from "lodash";
import {AbstractModel, IAttributeCastMap, INestedEntityMap} from "../abstractModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import Ingredient from "../ingredient/ingredientModel";
import RecipeIngredient from "../recipe/recipeIngredientModel";

export class MealLeftoverIngredientPivot extends AbstractModel {

    public groupId:string;
    public recipeId:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }
}

@changeAware
export default class MealLeftoverIngredient extends Ingredient {

    protected __primaryKey = 'ingredientId';

    protected __nestedEntityMap:INestedEntityMap = {
        _pivot: this.createOrHydratePivot
    };

    public _pivot:MealLeftoverIngredientPivot;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Hydrate with new or existing pivot data.
     * @param data
     * @param exists
     * @returns {RecipeIngredientPivot}
     */
    private createOrHydratePivot(data:any, exists:boolean = false):MealLeftoverIngredientPivot {
        return new MealLeftoverIngredientPivot(data._pivot);
    }

    /**
     * Convert RecipeIngredient to a MealLeftoverIngredient
     * @param recipeIngredient
     * @returns {MealLeftoverIngredient}
     */
    public static convertToMealLeftoverIngredient(recipeIngredient:RecipeIngredient) {
        let data = recipeIngredient.getAttributes(false);
        data['_pivot'] = {
            recipeId: recipeIngredient._pivot.recipeId,
            groupId: recipeIngredient._pivot.groupId
        };

        return new MealLeftoverIngredient(data);
    }

}

