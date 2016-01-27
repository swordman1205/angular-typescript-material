import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../../pagination/paginationService";
import Meal, {TMealTitleDefault, ISelectedRecipeIngredient, LEFTOVER_TYPE_PARTIAL} from "../../../models/meal/mealModel";
import MealDay from "../../../models/mealDay/mealDayModel";
import Recipe from "../../../models/recipe/recipeModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import MealLeftoverIngredient from "../../../models/meal/mealLeftoverIngredientModel";
import {LEFTOVER_TYPE_NEW} from "../../../models/meal/mealModel";

export const namespace = 'meal';

export default class MealService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Cycle given data
     * @param data
     * @returns {Cycle}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Meal {
        return new Meal(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @returns {string}
     * @param meal
     */
    public apiEndpoint(meal?:Meal):string {
        if (meal) {
            return '/meals/' + meal.getKey();
        }
        return '/meals';
    }

    public newMeal(mealDay:MealDay, mealTitle:TMealTitleDefault|string, firstRecipe:Recipe = null):Meal {

        let newMeal = new Meal({
            mealId: this.ngRestAdapter.uuid(),
            mealDayId: mealDay.getKey(),
            mealTitle: mealTitle,
            leftoverType: LEFTOVER_TYPE_NEW
        });

        if (firstRecipe) {
            newMeal._recipes.push(firstRecipe);
            newMeal.setAllRecipeIngredients();
        }

        return newMeal;
    }

    /**
     * Save with all the nested entities too
     * @param meal
     * @returns {IPromise<Program>}
     */
    public save(meal:Meal):ng.IPromise<Meal> {

        meal.cleanProperties();

        return this.saveModel(meal)
            .then(() => this.$q.all([
                this.saveRelatedEntities(meal),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>meal).resetChanged(); //reset so next save only saves the changed ones
                meal.setExists(true);
                return meal;
            });

    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:Meal):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveRecipes(entity),
            this.saveLeftoverIngredients(entity)
        ]);

    }

    /**
     * Save the recipes to the meal.
     * @param meal
     * @returns {any}
     */
    private saveRecipes(meal:Meal):ng.IPromise<Recipe[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>meal).getChanged(true), '_recipes')) {
            return this.$q.when(false);
        }

        let recipes = _.filter(meal._recipes, (recipe:Recipe) => !recipe.isLinkedTo(meal));

        return this.$q.all(_.map(recipes, (recipe:Recipe) => {
                return this.ngRestAdapter.put(this.apiEndpoint(meal) + '/recipes/' + recipe.getKey(), {
                    recipeId: recipe.getKey(),
                });
            }))
            .then(() => {
                return _.map(meal._recipes, (recipe:Recipe) => {
                    recipe._pivot = {
                        recipeId: recipe.getKey(),
                        mealId: meal.getKey(),
                    };
                    return recipe;
                });
            });

    }

    /**
     * Save the leftover ingredients to the meal.
     * @param meal
     * @returns {IPromise<boolean>}
     */
    private saveLeftoverIngredients(meal:Meal):ng.IPromise<MealLeftoverIngredient[]|boolean> {

        if (!_.has(meal, '__allRecipeIngredients') || meal.leftoverType != LEFTOVER_TYPE_PARTIAL) {
            return this.$q.when(false);
        }

        let mealLeftoverIngredients = _.chain(meal.__allRecipeIngredients)
            .filter((selectedRecipeIngredient:ISelectedRecipeIngredient) => selectedRecipeIngredient.selected)
            .map((selectedRecipeIngredient:ISelectedRecipeIngredient) => MealLeftoverIngredient.convertToMealLeftoverIngredient(selectedRecipeIngredient.recipeIngredient))
            .value();

        if (_.isEmpty(mealLeftoverIngredients)) {
            return this.$q.when(false);
        }

        return this.ngRestAdapter.put(this.apiEndpoint(meal) + '/leftover-ingredients', mealLeftoverIngredients)
            .then(() => {
                return mealLeftoverIngredients;
            });

    }

    /**
     * Unlink a recipe
     * @param meal
     * @param recipe
     * @returns {IPromise<boolean>}
     */
    public unlinkRecipe(meal:Meal, recipe:Recipe):ng.IPromise<boolean> {

        return this.ngRestAdapter.remove(this.apiEndpoint(meal) + '/recipes/' + recipe.getKey()).then(() => true);
    }
}

angular.module(namespace, [])
    .service('mealService', MealService);





