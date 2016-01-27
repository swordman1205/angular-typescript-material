import * as _ from "lodash";
import Recipe from "../recipe/recipeModel";
import {AbstractModel, INestedEntityMap} from "../abstractModel";
import Ingredient from "../ingredient/ingredientModel";
import RecipeIngredient from "../recipe/recipeIngredientModel";

export interface IShoppingListItemSource {
    recipeId:string;
    _recipe:Recipe;
    servings:number;
}

export default class ShoppingListItem extends AbstractModel implements AbstractModel {

    protected __nestedEntityMap:INestedEntityMap = {
        _ingredient: Ingredient,
        _recipeIngredient: this.hydrateRecipeIngredient,
    };

    public ingredientId:string;
    public _ingredient:Ingredient;
    public _recipeIngredient:RecipeIngredient;

    public quantity:number;
    public source:IShoppingListItemSource[];
    public unit:string; //@todo determine if this is relevant, or should be inferred by the ingredient

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Hydrate recipe ingredient
     * @param data
     * @param exists
     * @returns {RecipeIngredientPivot}
     */
    private hydrateRecipeIngredient(data:any, exists:boolean = false):RecipeIngredient {

        return new RecipeIngredient(_.merge(data._ingredient, {
            _pivot: {
                nameOverride: null,
                optional: false,
                description: null,
                amount: data.quantity,
                amountType: data.unit,
            }
        }));

    }

}

