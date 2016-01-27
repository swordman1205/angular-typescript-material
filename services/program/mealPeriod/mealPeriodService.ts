import * as angular from "angular";
import * as _ from "lodash";
import PaginationService from "../../pagination/paginationService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {AbstractApiService} from "../../abstractApiService";
import MealPeriod from "../../../models/mealPeriod/mealPeriodModel";
import MealDayService from "../mealDay/mealDayService";
import Cycle from "../../../models/cycle/cycleModel";
import MealDay from "../../../models/mealDay/mealDayModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";
import SpiraException from "../../../../exceptions";

export interface IPeriodIndexStateParams extends ng.ui.IStateParamsService {
    periodIndex:string;
}

export class MealPeriodException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'MealPeriodException';
    }
}

export const namespace = 'mealPeriod';

export default class MealPeriodService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'mealDayService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                protected mealDayService:MealDayService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Cycle given data
     * @param data
     * @returns {Cycle}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):MealPeriod {
        return new MealPeriod(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @returns {string}
     * @param mealPeriod
     */
    public apiEndpoint(mealPeriod?:MealPeriod):string {
        if (mealPeriod) {
            return '/meal-periods/' + mealPeriod.getKey();
        }
        return '/meal-periods';
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newMealPeriod():MealPeriod {

        return new MealPeriod({
            mealPeriodId: this.ngRestAdapter.uuid(),
        });

    }

    public calculateMealDayDates(cycle:Cycle, mealPeriod:MealPeriod):void {

        let periodStartDate:moment.Moment = moment(cycle.periodOneStartDate).add(mealPeriod.mealPeriodIndex * cycle._program.periodLength, 'days').startOf('day');

        let today:moment.Moment = moment();

        mealPeriod._mealDays = _.chain(mealPeriod._mealDays)
            .sortBy('mealDayIndex')
            .map((mealDay:MealDay) => {
                mealDay.__date = periodStartDate.clone().add(mealDay.mealDayIndex, 'days');
                mealDay.__isPast = mealDay.__date.isBefore(today, 'day');
                mealDay.__isToday = mealDay.__date.isSame(today, 'day');

                return mealDay;
            })
            .value();

    }

    /**
     * Save with all the nested entities too
     * @param mealPeriod
     * @returns {IPromise<Program>}
     */
    public save(mealPeriod:MealPeriod):ng.IPromise<MealPeriod> {

        return this.saveModel(mealPeriod)
            .then(() => this.$q.all([
                this.saveRelatedEntities(mealPeriod),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>mealPeriod).resetChanged(); //reset so next save only saves the changed ones
                mealPeriod.setExists(true);
                return mealPeriod;
            });

    }

    /**
     * Save the meal days in the meal period
     * @returns {any}
     * @param mealPeriod
     */
    private saveMealDays(mealPeriod:MealPeriod):ng.IPromise<MealDay[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>mealPeriod).getChanged(true), '_mealDays')) {
            return this.$q.when(false);
        }

        return this.$q.all(_.map(mealPeriod._mealDays, (mealDay:MealDay) => this.mealDayService.save(mealDay)));
    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:MealPeriod):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveMealDays(entity),
            // this.saveEntityProgramOptions(entity)
        ]);

    }

    /**
     * This function is used to determine if we can access a period given all periods, cycle information and an
     * optionally requested index in $stateParams.
     *
     * @param mealPeriods
     * @param cycle
     * @param $stateParams
     * @returns {number|boolean}
     */
    public getPeriodIndex(mealPeriods:MealPeriod[], cycle:Cycle, $stateParams:IPeriodIndexStateParams = null):number|boolean {

        let today:moment.Moment = moment();
        let currentPeriod:MealPeriod = _.find(mealPeriods, (mealPeriod:MealPeriod) => {
            this.calculateMealDayDates(cycle, mealPeriod);
            return (<any>today).isBetween(_.first(mealPeriod._mealDays).__date, _.last(mealPeriod._mealDays).__date.clone().endOf('day'));
        });
        if (currentPeriod) { // We're in the program
            if ($stateParams && !!$stateParams.periodIndex) { // We're looking for a specific meal period
                let stateParamsPeriodIndex:number = Number($stateParams.periodIndex);

                if (currentPeriod.mealPeriodIndex >= stateParamsPeriodIndex) {
                    // We're looking for a meal period in the present or past
                    return stateParamsPeriodIndex;
                }
                else { // We're looking for a meal period in the future
                    let targetPeriod = _.find(mealPeriods, {mealPeriodIndex: stateParamsPeriodIndex});
                    if (targetPeriod && targetPeriod.canAccessMeals(cycle, today)) {
                        // We're allowed to see next period's meal plan/shopping list, continue
                        return stateParamsPeriodIndex;
                    }
                    else {
                        // We're looking for a meal period in the future not within meal plan early access days, this is invalid
                        // @Todo: Update URL?
                        return currentPeriod.mealPeriodIndex;
                    }
                }
            }
            else {
                return currentPeriod.mealPeriodIndex;
            }
        }
        else {
            // We're not in the program, check to see if we can access the first period's meals/shopping list
            let firstPeriod = _.find(mealPeriods, {mealPeriodIndex: 0});
            if (firstPeriod && firstPeriod.canAccessMeals(cycle, today)) {
                return 0;
            }
        }

        return false; // We're trying to access a meal plan/shopping list before we're allowed to
    }
    
    public getDownloadLink(mealPeriod:MealPeriod, bustCache:boolean = false):ng.IPromise<string> {
        
        let headers:ng.HttpHeaderType = {};
        if (bustCache) {
            headers['Bust-Cache'] = 'true';
        }
        
        return this.ngRestAdapter.skipInterceptor()
            .get(this.apiEndpoint(mealPeriod) + '/pdf', headers)
            .then((res) => {
                // format is {'url':'http://...'}
                return res.data;
            });
    }
}

angular.module(namespace, [])
    .service('mealPeriodService', MealPeriodService);





