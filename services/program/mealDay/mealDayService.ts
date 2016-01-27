import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../../pagination/paginationService";
import MealDay from "../../../models/mealDay/mealDayModel";
import MealService from "../meal/mealService";
import {TMealTitleDefault, default as Meal} from "../../../models/meal/mealModel";
import MealPeriod from "../../../models/mealPeriod/mealPeriodModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";

export const namespace = 'mealDay';

export default class MealDayService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'mealService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                protected mealService:MealService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Cycle given data
     * @param data
     * @returns {Cycle}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):MealDay {
        return new MealDay(data, exists);
    }

    /**
     * Get the api endpoint for the entity
     * @returns {string}
     * @param mealDay
     */
    public apiEndpoint(mealDay?:MealDay):string {
        if (mealDay) {
            return '/meal-days/' + mealDay.getKey();
        }
        return '/meal-days';
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newMealDay():MealDay {

        return new MealDay({
            mealDayId: this.ngRestAdapter.uuid(),
        });

    }

    public initialiseMealsInEmptyDays(mealPeriod:MealPeriod):void {

        let defaultMeals:TMealTitleDefault[] = ['Breakfast', 'Lunch', 'Dinner'];

        _.each(mealPeriod._mealDays, (mealDay:MealDay) => {
            if (!_.isEmpty(mealDay._meals)) { //if the meal day already has some meals, don't fill with defaults
                return;
            }

            _.each(defaultMeals, (mealTitle:TMealTitleDefault) => {

                mealDay._meals.push(this.mealService.newMeal(mealDay, mealTitle));

            });

            mealDay.updateMealSortOrder();

        });
    }

    /**
     * Save with all the nested entities too
     * @param mealDay
     * @returns {IPromise<Program>}
     */
    public save(mealDay:MealDay):ng.IPromise<MealDay> {

        return this.saveModel(mealDay)
            .then(() => this.$q.all([
                this.saveRelatedEntities(mealDay),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>mealDay).resetChanged(); //reset so next save only saves the changed ones
                mealDay.setExists(true);
                return mealDay;
            });

    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:MealDay):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveMeals(entity),
        ]);

    }

    /**
     * Save the meals to the meal day.
     * @param mealDay
     * @returns {any}
     */
    private saveMeals(mealDay:MealDay):ng.IPromise<Meal[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>mealDay).getChanged(true), '_meals')) {
            return this.$q.when(false);
        }

        return this.$q.all(_.map(mealDay._meals, (meal:Meal) => this.mealService.save(meal)));
    }

}

angular.module(namespace, [])
    .service('mealDayService', MealDayService);





