import * as angular from "angular";
import * as _ from "lodash";
import RecipeService from "../../recipe/recipeService";
import PaginationService from "../../pagination/paginationService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {AbstractApiService} from "../../abstractApiService";
import MealPlan from "../../../models/mealPlan/mealPlanModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import Recipe from "../../../models/recipe/recipeModel";
import MealPeriod from "../../../models/mealPeriod/mealPeriodModel";
import User from "../../../models/user/userModel";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";

export const namespace = 'mealPlan';

export default class MealPlanService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'recipeService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                private recipeService:RecipeService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Cycle given data
     * @param data
     * @returns {Cycle}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):MealPlan {
        return new MealPlan(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @returns {string}
     * @param mealPlan
     */
    public apiEndpoint(mealPlan?:MealPlan):string {
        if (mealPlan) {
            return '/meal-plans/' + mealPlan.getKey();
        }
        return '/meal-plans';
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newMealPlan():MealPlan {

        return new MealPlan({
            mealPlanId: this.ngRestAdapter.uuid(),
        });

    }

    public save(mealPlan:MealPlan):ng.IPromise<MealPlan> {
        return this.saveModel(mealPlan)
            .then(() => this.$q.all([
                this.saveRelatedEntities(mealPlan),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>mealPlan).resetChanged(); //reset so next save only saves the changed ones
                mealPlan.setExists(true);
                return mealPlan;
            });
    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:MealPlan):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveRecipes(entity),
            // this.saveEntityProgramOptions(entity)
        ]);

    }

    /**
     * Save the ingredients to the recipe.
     * @param mealPlan
     * @returns {any}
     */
    private saveRecipes(mealPlan:MealPlan):ng.IPromise<Recipe[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>mealPlan).getChanged(true), '_recipes')) {
            return this.$q.when(false);
        }

        let recipes = _.filter(mealPlan._recipes, (recipe:Recipe) => !recipe.isLinkedTo(mealPlan));

        return this.$q.all(_.map(recipes, (recipe:Recipe) => {
                return this.ngRestAdapter.put(this.apiEndpoint(mealPlan) + '/recipes/' + recipe.getKey(), {
                    recipeId: recipe.getKey(),
                });
            }))
            .then(() => {
                return _.map(mealPlan._recipes, (recipe:Recipe) => {
                    recipe._pivot = {
                        recipeId: recipe.getKey(),
                        mealPlanId: mealPlan.getKey(),
                    };
                    return recipe;
                });
            });

    }

    public getAlwaysRecipes(mealPlan:MealPlan):ng.IPromise<Recipe[]> {
        return this.recipeService.getAllModels<Recipe>(['author'], this.apiEndpoint(mealPlan) + '/recipes/always');
    }

    public unlinkRecipe(mealPlan:MealPlan, recipe:Recipe) {
        return this.ngRestAdapter.remove(this.apiEndpoint(mealPlan) + '/recipes/' + recipe.getKey()).then(() => true);
    }

    public nextMealPlanPeriodCanBeAccessed(mealPlan:MealPlan, mealPeriod:MealPeriod):boolean {
        if (mealPlan._cycle._program.periodCount <= mealPeriod.mealPeriodIndex) {
            return false;
        }

        let nextMealPeriodStart:moment.Moment = _.last(mealPeriod._mealDays).__date.clone().add(1, 'day');
        if (nextMealPeriodStart.diff(moment(), 'days') > mealPlan._cycle.mealPeriodEarlyAccessDays) {

            return false;
        }

        return true;
    }

    /**
     * Grant complimentary access to a user for special circumstances ie to a blogger or IQS supporter
     * PUT /meal-plans/{id}/access-complimentary/{childId}
     */
    public grantComplimentaryAccess(mealPlan:MealPlan, user:User, attachData:any):ng.IPromise<any> {
        return this.ngRestAdapter.put(this.apiEndpoint(mealPlan) + '/access-complimentary/' + user.getKey(), attachData);
    };

}

angular.module(namespace, [])
    .service('mealPlanService', MealPlanService);





