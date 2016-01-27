import * as angular from "angular";
import * as _ from "lodash";
import ScheduleService, {ISchedule, ISchedulePeriod} from "../scheduleService";
import CycleScheduleItem from "../../../../models/cycleScheduleItem/cycleScheduleItemModel";
import MealPlan from "../../../../models/mealPlan/mealPlanModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService, {Paginator} from "../../../pagination/paginationService";
import MealDayService from "../../mealDay/mealDayService";
import Program from "../../../../models/program/programModel";
import Cycle from "../../../../models/cycle/cycleModel";
import MealDay from "../../../../models/mealDay/mealDayModel";
import {momentExtended as moment} from "../../../../../common/libs/moment/moment";

export const namespace = 'feed';

export interface IPeriodIndexes {
    periodIndex:number;
    dayIndex:number;
}

export default class FeedService extends ScheduleService {

    static announcementDismissalStorageKey = 'feed.dismissedAnnouncements';

    public allFeedItems:CycleScheduleItem[];
    public currentFeedItem:CycleScheduleItem;
    private mealPlan:MealPlan;
    private schedule:ISchedule;
    private maxPeriod:number = null;
    protected search:string = null; // This encoded search is required to be sent to generate a preview

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', '$window', 'mealDayService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService, //note this is using a customised pagination service
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                protected $window:ng.IWindowService,
                protected mealDayService:MealDayService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @param scheduledItem
     * @param cycleId
     * @param preview
     * @returns {string}
     */
    public apiEndpoint(scheduledItem?:CycleScheduleItem, cycleId?:string, preview?:boolean):string {
        let endpoint = `/cycles/${cycleId}/scheduled-items/feed`;
        if (preview) {
            endpoint += '/preview';
        }

        return endpoint;
    }

    /**
     * Initialize the feed so the paginator has all the data it needs to start getting feed items
     * @param program
     * @param cycle
     * @param currentMealPlan
     * @param preview
     * TODO: unit tests for preview feed functionality
     */
    public initializeFeed(program:Program, cycle:Cycle, currentMealPlan:MealPlan, preview?:boolean):this {

        this.mealPlan = currentMealPlan;

        this.schedule = this.getSchedule(program, cycle);

        this.clearCachedPaginator();

        let paginator:Paginator = this.getPaginator(['scheduledItem.categoryTag', 'scheduledItem.commentsCount'], this.apiEndpoint(null, cycle.programCycleId, preview))
            .reset();

        paginator.setModelFactory((data:any, exists:boolean = false):CycleScheduleItem => {
            let model = new CycleScheduleItem(data, exists);

            if (!model.__scheduleDateTime) {
                this.setScheduleItemDate(this.schedule, model);
            }

            return model;
        });

        return this;
    }

    /**
     * Clear the feed items and reset the paginator so it all starts over again
     * @returns {feed.FeedService}
     */
    public resetFeed():this {
        this.allFeedItems = []; //clear feed for reload/program switch

        if (!_.isNumber(this.maxPeriod)) {
            this.addMealPlan();
        }

        this.cachedPaginator.reset();

        return this;
    }

    /**
     * Get feed items
     * @param count
     * @returns {IPromise<CycleScheduleItem[]>}
     */
    public getFeedItems(count:number):ng.IPromise<CycleScheduleItem[]> {
        
        if (_.isNumber(this.maxPeriod) && this.search) {
            this.cachedPaginator.setSearch({
                'max-period-index': this.maxPeriod,
                'search': this.search
            });
        } else if (_.isNumber(this.maxPeriod)) {
            this.cachedPaginator.setSearch({
                'max-period-index': this.maxPeriod
            });
        }

        return this.cachedPaginator.getNext(count)
            .then((feedItems:CycleScheduleItem[]) => {

                let returnCount = feedItems.length;

                feedItems = _.filter(feedItems, (feedItem:CycleScheduleItem) => !this.isDismissed(feedItem.getKey()));

                _.invokeMap(feedItems, 'hydrateMeta');

                this.allFeedItems = this.allFeedItems.concat(feedItems);

                //if the filtering removed some requested items, retrieve more to fill the gap
                if (feedItems.length < returnCount) {
                    return this.getFeedItems(returnCount - feedItems.length);
                }

                return feedItems;
            });
    }

    /**
     * Hide an announcement card, saving to localstorage so it doesn't reappear
     * @param announcement
     */
    public dismissAnnouncement(announcement:CycleScheduleItem):void {
        this.addToDismissed(announcement.getKey());

        this.allFeedItems = _.without(this.allFeedItems, announcement);
    }

    /**
     * Get the list of dismissed announcement keys
     */
    private dismissalCache:string[];

    private getDismissed():string[] {
        if (!this.dismissalCache) {
            let loadedValue = angular.fromJson(this.$window.localStorage.getItem(FeedService.announcementDismissalStorageKey));
            if (!_.isArray(loadedValue)) {
                loadedValue = [];
            }
            this.dismissalCache = loadedValue;
        }

        return this.dismissalCache;
    }

    /**
     * Add an announcement key to dismissal list
     * @param announcementId
     */
    private addToDismissed(announcementId:string):void {
        let all = this.getDismissed();
        all.push(announcementId);
        this.$window.localStorage.setItem(FeedService.announcementDismissalStorageKey, angular.toJson(all));
    }

    /**
     * Check if an item is dismissed
     * @param announcementId
     * @returns {boolean}
     */
    private isDismissed(announcementId:string):boolean {
        return _.includes(this.getDismissed(), announcementId);
    }

    /**
     * Add a meal plan card, by default to the first position
     */
    private addMealPlan():void {

        let mealPlanDate = moment().startOf('day');
        if (mealPlanDate.isBefore(this.mealPlan._cycle.periodOneStartDate.clone())) {
            return; // Don't add meal plan card, we're in preseason before meal plan early access
        }

        let mealPlanIndexes = this.getPeriodDayIndexes(mealPlanDate);
        let nextMealPlanPeriodIndex = mealPlanIndexes.periodIndex + 1;
        let program = this.mealPlan._cycle._program;

        let feedItem = new CycleScheduleItem({
            scheduledItemType: 'MealPlan',
            feedFormat: 'mealPlan',
            stickyInFeed: true,
            _scheduledItem: null,
            __scheduleDateTime: mealPlanDate,
            __meta: {
                mealPlanPeriod: mealPlanIndexes.periodIndex,
                nextMealPlan: {
                    available: this.nextMealPlanCanBeAccessed(nextMealPlanPeriodIndex + 1),
                    periodIndex: nextMealPlanPeriodIndex,
                    name: program.periodName + " " + (nextMealPlanPeriodIndex + 1)
                }
            }
        });

        feedItem.hydrateMeta();

        this.allFeedItems.splice(0, 0, feedItem);
    }

    private nextMealPlanCanBeAccessed(period:number):boolean {

        if (this.mealPlan._cycle._program.periodCount <= period) {
            return false;
        }

        // this.schedule.periods[period], the 0th period is pre-season
        return this.schedule.periods[period].periodStart.diff(moment(), 'days') <= this.mealPlan._cycle.mealPeriodEarlyAccessDays;
    }

    public getCurrentMealPlanDay():ng.IPromise<MealDay> {

        let indexes = this.getPeriodDayIndexes();
        if (indexes.periodIndex < 0) {
            indexes.periodIndex = 0;
            indexes.dayIndex = 0;
        }

        return this.mealDayService.getModel<MealDay>('', ['meals.recipes'], `/meal-plans/${this.mealPlan.getKey()}/periods/${indexes.periodIndex}/days/${indexes.dayIndex}`);
    }

    /**
     * Get the numeric period indexes
     * @todo consider timezone offsetting
     * @returns {{period: number, day: number}}
     */
    public getPeriodDayIndexes(timestamp:moment.Moment = moment()):IPeriodIndexes {

        let periodIndex:number = -1; // Pre-season
        let dayIndex:number = -1;

        //if cycle is in the past
        if (timestamp > _.last(this.schedule.periods).periodEnd) {
            periodIndex = this.mealPlan._cycle._program.periodCount;
            dayIndex = this.mealPlan._cycle._program.periodLength - 1;
        }

        let thisPeriod = _.find(this.schedule.periods, (period:ISchedulePeriod) => {
            return period.periodStart < timestamp && period.periodEnd > timestamp;
        });

        if (thisPeriod) {
            periodIndex = thisPeriod.periodIndex;
            dayIndex = timestamp.diff(thisPeriod.periodStart, 'days');
        }

        return {
            periodIndex: periodIndex,
            dayIndex: dayIndex,
        }

    }

    public setPeriodIndexOffset(activePeriod:number):this {
        this.maxPeriod = activePeriod;
        return this;
    }

    public isLiveFeed():boolean {
        return this.maxPeriod == null;
    }

    public clearPeriodIndexOffset():this {
        this.maxPeriod = null;
        return this;
    }

    public setCurrentItem(item:CycleScheduleItem):void {

        this.currentFeedItem = item;
    }

    public getRelativeFeedItem(referenceFeedItem:CycleScheduleItem, offset:number = 0, filter:(feedItem:CycleScheduleItem)=>boolean = null):CycleScheduleItem {
        if (!this.allFeedItems) {
            return;
        }

        let itemsToSearch = this.allFeedItems;

        if (_.isFunction(filter)) {
            itemsToSearch = _.filter(itemsToSearch, filter);
        }

        let referenceIndex = _.indexOf(itemsToSearch, referenceFeedItem);

        return itemsToSearch[referenceIndex + offset];
    }

    public setSearch(encodedSearch:string):void {
        this.search = encodedSearch;
    }
}

angular.module(namespace, [])
    .service('feedService', FeedService)





