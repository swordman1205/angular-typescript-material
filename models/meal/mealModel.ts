import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import Recipe from "../recipe/recipeModel";
import * as _ from "lodash";
import RecipeIngredient from "../recipe/recipeIngredientModel";
import MealLeftoverIngredient from "./mealLeftoverIngredientModel";

export interface ISelectedRecipeIngredient {
    recipeIngredient:RecipeIngredient;
    selected:boolean;
}

export type TMealTitleDefault = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type TLeftoverType = 'new' | 'complete' | 'partial';

export const LEFTOVER_TYPE_NEW:TLeftoverType = 'new';
export const LEFTOVER_TYPE_COMPLETE:TLeftoverType = 'complete';
export const LEFTOVER_TYPE_PARTIAL:TLeftoverType = 'partial';

@changeAware
export default class Meal extends AbstractModel {
    protected __primaryKey = 'mealId';

    protected __nestedEntityMap:INestedEntityMap = {
        _recipes: Recipe,
        _leftoverSourceMeal: Meal,
        _leftoverIngredients: RecipeIngredient
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public mealId:string;
    public mealDayId:string;
    public mealTitle:TMealTitleDefault|string;
    public recipeId:string;
    public leftoverType:TLeftoverType;
    public leftoverSourceMealId:string;
    public mandatory:boolean;

    public _recipes:Recipe[] = [];
    public _leftoverSourceMeal:Meal;
    public _leftoverIngredients:MealLeftoverIngredient[] = [];

    // This is used to provide the models for the checkboxes (to select partial leftovers)
    public __allRecipeIngredients:ISelectedRecipeIngredient[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);

        this.setAllRecipeIngredients();
    }

    public static getMealTitleDefaults():TMealTitleDefault[] {
        return <TMealTitleDefault[]>['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    }

    public setAllRecipeIngredients():void {
        if (this._recipes.length > 0) {
            _.forEach(this._recipes, (recipe:Recipe) => {
                _.forEach(recipe._ingredients, (recipeIngredient:RecipeIngredient) => {
                    let selected = false;
                    if (_.find(this._leftoverIngredients, {
                            _pivot: {
                                groupId: recipeIngredient._pivot.groupId,
                                recipeId: recipeIngredient._pivot.recipeId
                            },
                            ingredientId: recipeIngredient.ingredientId
                        })) {
                        selected = true;
                    }
                    this.__allRecipeIngredients.push(<ISelectedRecipeIngredient>{
                        recipeIngredient: recipeIngredient,
                        selected: selected
                    });
                });
            });
        }
    }

    public cleanProperties():void {

        if (this.leftoverType == LEFTOVER_TYPE_NEW) {
            this.leftoverSourceMealId = null;
        }

        if (this.leftoverType != LEFTOVER_TYPE_PARTIAL) {
            this._leftoverIngredients = [];
        }
    }
}

