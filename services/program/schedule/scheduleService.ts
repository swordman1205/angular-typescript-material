import * as angular from "angular";
import * as _ from "lodash";
import SpiraException from "../../../../exceptions";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import {AbstractApiService} from "../../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../../pagination/paginationService";
import Cycle from "../../../models/cycle/cycleModel";
import Program from "../../../models/program/programModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import {IProgramOptionType, IProgramOptionSelected} from "../programOption/programOptionService";
import ProgramOption from "../../../models/programOption/programOptionModel";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";

export const namespace = 'schedule';

export interface IScheduleDay {
    dayKey:string;
    dayDate:moment.Moment;
    scheduleItems:CycleScheduleItem[];
}

export interface ISchedulePeriod {
    periodName:string;
    periodInfo:string;
    periodIndex:number;
    periodStart:moment.Moment;
    periodEnd:moment.Moment;
    days:IScheduleDay[];
}

export interface ISchedule {
    periods:ISchedulePeriod[];
    unscheduledItems:CycleScheduleItem[];
}

export interface IFeedFormatOption {
    key:string;
    name:string;
    appliesTo:string[];
}

export class ScheduleServiceException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'ScheduleServiceException';
    }
}

export default class ScheduleService extends AbstractApiService {

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
    protected modelFactory(data:any, exists:boolean = false):CycleScheduleItem {
        return new CycleScheduleItem(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @param scheduledItem
     * @param cycleId
     * @returns {string}
     */
    public apiEndpoint(scheduledItem?:CycleScheduleItem, cycleId?:string):string {

        let route = '/scheduled-items/';

        if (cycleId) {
            route = '/cycles/' + cycleId + route;
        }

        if (scheduledItem) {
            return route + scheduledItem.getKey();
        }

        return route;
    }

    /**
     * Get a new scheduled item with no values and a set uuid
     * @returns {Recipe}
     */
    public newScheduledItem(cycle:Cycle):CycleScheduleItem {

        let newCycleScheduleItem = new CycleScheduleItem({
            cycleScheduleItemId: this.ngRestAdapter.uuid(),
            programCycleId: cycle.getKey(),
            feedFormat: 'headlineText' // default format so the feed knows what to display
        }, false);

        // Copy the cycle's program options
        newCycleScheduleItem._options = _.map(cycle._options, (option:ProgramOption) => {
            option._pivot = {
                cycleScheduleItemId: newCycleScheduleItem.cycleScheduleItemId,
                programOptionId: option.programOptionId
            };

            return option;
        });

        return newCycleScheduleItem;

    }

    /**
     * Get a blank schedule.
     * @param program
     * @param cycle
     * @returns {ISchedule}
     */
    public getSchedule(program:Program, cycle:Cycle):ISchedule {

        let schedule:ISchedule = {
            periods: [],
            unscheduledItems: [],
        };

        let preSeasonInfo = cycle.getPeriodInfo(-1, {
            index: -1,
            name: 'Pre Season',
            info: null
        });

        // Sales/Pre Season start date includes the 'hidden sales' period
        // Sales/Pre Season end date includes the 'allow sales after end' period
        schedule.periods.push({
            periodName: preSeasonInfo.name,
            periodInfo: preSeasonInfo.info,
            periodIndex: preSeasonInfo.index,
            periodStart: cycle.getFirstDayOfSale().clone().startOf('day'),
            periodEnd: cycle.periodOneStartDate.clone().add(-1, 'days').endOf('day'),
            days: []
        });

        for (let i = 0; i < program.periodCount; i++) {

            let offset:number = i * program.periodLength;

            let periodInfo = cycle.getPeriodInfo(i, {
                index: i,
                name: 'Period ' + (i + 1),
                info: null
            });

            schedule.periods.push({
                periodName: periodInfo.name,
                periodInfo: periodInfo.info,
                periodIndex: periodInfo.index,
                periodStart: cycle.periodOneStartDate.clone().add(offset, 'days').startOf('day'),
                periodEnd: cycle.periodOneStartDate.clone().add(offset + program.periodLength - 1, 'days').endOf('day'),
                days: []
            });
        }

        let postSeasonEndDate:moment.Moment = _.last(schedule.periods).periodEnd.clone().add(1, 'days');

        let postSeasonInfo = cycle.getPeriodInfo(schedule.periods.length, {
            index: schedule.periods.length,
            name: 'Post Season',
            info: null
        });

        // The post season end date is the last day of the period sections plus the post season
        // days, i.e. Guide general access end is not shown anywhere here.
        schedule.periods.push({
            periodName: postSeasonInfo.name,
            periodInfo: postSeasonInfo.info,
            periodIndex: postSeasonInfo.index,
            periodStart: postSeasonEndDate.startOf('day'),
            periodEnd: postSeasonEndDate.clone().add(cycle.postSeasonDays, 'days').endOf('day'),
            days: []
        });

        return schedule;
    }

    /**
     * Assign an item to a period or move it to another period. It will assign the item to period as determined
     * by it's __scheduleDateTime attribute.
     *
     * @param schedule
     * @param scheduleItem
     * @param add - If this is true, it will just add the item and not bother searching for duplicates
     */
    public assignScheduleItemToPeriod(schedule:ISchedule, scheduleItem:CycleScheduleItem, add:Boolean = false):void {

        // Search for and remove the item from the schedule first
        if (!add) {
            _.forEach(schedule.periods, (period:ISchedulePeriod) => {
                period.days = _.reject(period.days, (day:IScheduleDay) => {
                    day.scheduleItems = _.reject(day.scheduleItems, (item:CycleScheduleItem) => {
                        return item.cycleScheduleItemId == scheduleItem.cycleScheduleItemId;
                    });

                    return day.scheduleItems.length < 1;
                })
            });
        }

        if (!scheduleItem.scheduledRelativeTo || !scheduleItem.__scheduleDateTime) {
            schedule.unscheduledItems.push(scheduleItem);
            return;
        }

        let localDateTime = scheduleItem.__scheduleDateTime.clone().local();

        let period = _.find(schedule.periods, (period:ISchedulePeriod) => {
            // We want to see the schedule in local time
            // isBetween is exclusive and day is the granularity (default is ms)
            return (<any>localDateTime).isBetween(period.periodStart.clone().add(-1, 'days'), period.periodEnd.clone().add(1, 'days'), 'day');
        });

        if (!period) {
            schedule.unscheduledItems.push(scheduleItem);
            return;
        }

        let dayString = localDateTime.format('YYYY-MM-DD');

        // Create a day to assign items to in the schedule
        let day = _.find(period.days, {dayKey: dayString});
        if (!day) {

            day = {
                dayKey: dayString,
                dayDate: localDateTime.startOf('day'),
                scheduleItems: [],
            };

            period.days.push(day);

        }

        day.scheduleItems.push(scheduleItem);
    }

    /**
     * Add items to a schedule.
     * @param schedule
     * @param scheduleItems
     * @returns {ISchedule}
     */
    public addItemsToSchedule(schedule:ISchedule, scheduleItems:CycleScheduleItem[]):ISchedule {

        _.each(scheduleItems, (scheduleItem:CycleScheduleItem) => {

            this.setScheduleItemDate(schedule, scheduleItem);

            this.assignScheduleItemToPeriod(schedule, scheduleItem, true);

        });

        return schedule;
    }

    /**
     * Sets a schedule item's __scheduleDateTime depending on how it's configured.
     * @param schedule
     * @param scheduleItem
     */
    public setScheduleItemDate(schedule:ISchedule, scheduleItem:CycleScheduleItem):void {

        if (scheduleItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypeGlobal) {

            this.verifyDateAndTimeNotNull(scheduleItem);

            scheduleItem.__scheduleDateTime = moment.utc(scheduleItem.scheduleDate.format('YYYY-MM-DD') + ' ' + scheduleItem.scheduleTime.format(), 'YYYY-MM-DD HH:mm:ss', true);

        }
        else if (scheduleItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypeTimezone) {

            this.verifyDateAndTimeNotNull(scheduleItem);

            scheduleItem.__scheduleDateTime = moment(scheduleItem.scheduleDate.format('YYYY-MM-DD') + ' ' + scheduleItem.scheduleTime.format(), 'YYYY-MM-DD HH:mm:ss', true);

        }
        else if (scheduleItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypePeriod) {

            this.verifyDateAndTimeNotNull(scheduleItem, false);

            let period = _.find(schedule.periods, {periodIndex: scheduleItem.periodIndex});

            if (!period) {
                throw new ScheduleServiceException('Item is scheduled in a period which does not exist: ' + JSON.stringify(scheduleItem));
            }

            scheduleItem.__scheduleDateTime = moment(period.periodStart);
            scheduleItem.__scheduleDateTime.add(scheduleItem.scheduledRelativeToPeriodDays, 'days');
            scheduleItem.__scheduleDateTime.hours(scheduleItem.scheduleTime.hours());
            scheduleItem.__scheduleDateTime.minutes(scheduleItem.scheduleTime.minutes());
            scheduleItem.__scheduleDateTime.seconds(scheduleItem.scheduleTime.seconds());
        }
        else { // Unscheduled
            scheduleItem.__scheduleDateTime = null;
            return null;
        }

    }

    private verifyDateAndTimeNotNull(scheduleItem:CycleScheduleItem, verifyDate:boolean = true) {

        if((verifyDate && !scheduleItem.scheduleDate) || !scheduleItem.scheduleTime) {
            throw new ScheduleServiceException('Can\'t parse date/time for item: ' + JSON.stringify(scheduleItem));
        }

    }

    /**
     * Save with all the nested entities too
     * @param scheduleItem
     * @returns {IPromise<M>}
     */
    public save(scheduleItem:CycleScheduleItem):ng.IPromise<CycleScheduleItem> {

        this.cleanUpScheduleItem(scheduleItem);

        return this.saveModel(
            scheduleItem,
            this.apiEndpoint(scheduleItem, scheduleItem.programCycleId)
            )
            .then(() => this.$q.all([
                this.saveRelatedEntities(scheduleItem)
            ]))
            .then(() => {
                (<IChangeAwareDecorator>scheduleItem).resetChanged(); //reset so next save only saves the changed ones
                scheduleItem.setExists(true);
                return scheduleItem;
            });

    }

    /**
     * Validates that at least one program option will remain selected for a type.
     *
     * @param programOptionSelected
     * @param programOptionTypes
     * @returns {boolean}
     */
    public validateProgramOptionSelection(programOptionSelected:IProgramOptionSelected, programOptionTypes:IProgramOptionType[]):boolean {
        if (programOptionSelected.selected) { // Remove
            // We need to have at least one option selected per type, check this first
            let optionsOfSameType:number = _.filter(_.find(programOptionTypes, {type: {programOptionTypeId: programOptionSelected.programOption.programOptionTypeId}}).programOptions, (programOption:IProgramOptionSelected) => {
                return programOption.selected;
            }).length;

            if (optionsOfSameType < 2) {
                return false;
            }
        }

        return true
    }

    /**
     * Copy a scheduled item to another cycle.
     *
     * @param scheduleItem
     * @param cycle
     * @returns {IPromise<any>}
     */
    public copyScheduledItem(scheduleItem:CycleScheduleItem, cycle:Cycle):ng.IPromise<any> {

        return this.ngRestAdapter
            .put('/cycle-scheduled-items/' + scheduleItem.getKey() + '/copy-to-cycle/' + cycle.getKey(), {})

    }

    /**
     * Save all the related entities concurrently
     * @param scheduleItem
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(scheduleItem:CycleScheduleItem):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntityOptions(scheduleItem),
        ]);

    }

    /**
     * Save entity metas
     * @param scheduleItem
     * @returns {any}
     */
    private saveEntityOptions(scheduleItem:CycleScheduleItem):ng.IPromise<ProgramOption[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>scheduleItem).getChanged(true), '_options')) {
            return this.$q.when(false);
        }

        let requestObject = this.getNestedCollectionRequestObject(scheduleItem, '_options', false, false);

        return this.ngRestAdapter.put('/cycle-scheduled-items/' + scheduleItem.cycleScheduleItemId + '/options', requestObject)
            .then(() => {
                _.invokeMap(scheduleItem._options, 'setExists', true);
                return scheduleItem._options;
            });
    }

    /**
     * Clean up a scheduledItem. Look at what it's scheduled relative to and null fields
     * which are not applicable.
     *
     * @param scheduleItem
     */
    private cleanUpScheduleItem(scheduleItem:CycleScheduleItem):void {

        if (!scheduleItem.scheduledRelativeTo) {
            scheduleItem.scheduleDate = null;
            scheduleItem.scheduleTime = null;
            scheduleItem.periodIndex = null;
            scheduleItem.scheduledRelativeToPeriodDays = null;
        }
        else if (scheduleItem.scheduledRelativeTo == 'period') {
            scheduleItem.scheduleDate = null;
        }
        else {
            scheduleItem.periodIndex = null;
            scheduleItem.scheduledRelativeToPeriodDays = null;
        }

    }

    /**
     * Get all the options for the feed format. Locally cache to prevent repeated calls to api
     * @returns {IPromise<TResult>}
     */
    private feedFormatCachedPromise:ng.IPromise<IFeedFormatOption[]>;

    public getFeedFormatOptions():ng.IPromise<IFeedFormatOption[]> {

        if (!this.feedFormatCachedPromise) {
            this.feedFormatCachedPromise = this.ngRestAdapter.get('/cycle-scheduled-items/feed-formatting-options').then((res:{data:IFeedFormatOption[]}) => res.data);
        }

        return this.feedFormatCachedPromise;
    }

}

angular.module(namespace, [])
    .service('scheduleService', ScheduleService);





