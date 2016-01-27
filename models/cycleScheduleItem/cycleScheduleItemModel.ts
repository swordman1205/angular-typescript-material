import * as _ from "lodash";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import ProgramOption from "../programOption/programOptionModel";
import ProgramPost from "../post/programPost/programPostModel";
import Guide from "../post/guide/guideModel";
import {namespace as postStateName} from "../../../app/program/programItem/post/post";
import {namespace as guideStateName} from "../../../app/program/programItem/guide/guide";
import {namespace as mealPlanStateName} from "../../../app/program/meals/mealPlan/mealPlan";
import MealPlan from "../mealPlan/mealPlanModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";

export interface IStateNavigator {
    ($state:ng.ui.IStateService, options?:ng.ui.IStateOptions, extraParams?:Object):ng.IPromise<any>;
}

export interface IScheduleItemMeta {
    mealPlanPeriod?:number;
    nextMealPlan?:{
        available:boolean;
        periodIndex:number;
        name:string;
    }
    navigable?:boolean;
    navigator?:IStateNavigator;
    styleClass?:string;
    icon?:string;
    heading?:string;
}

export interface IFeedFormatOptions {
    styleClass:string;
    icon:string;
    heading:string|IHeadingProvider;
    navigable:boolean;
}

export interface IFeedFormatOptionsProvider {
    (item:CycleScheduleItem):IFeedFormatOptions;
}

export interface IFeedFormatOptionsMap {
    [key:string]:(IFeedFormatOptions | IFeedFormatOptionsProvider);
}

export interface IHeadingProvider {
    (item:CycleScheduleItem):string;
}

export interface IHeadingProviderFactory {
    (defaultHeading:string):IHeadingProvider;
}

@changeAware
export default class CycleScheduleItem extends AbstractModel {

    public static iconMap = {
        announcement: 'icon-announcements',
        calendar: 'icon-calendar-o',
        article: 'icon-article',
        rate: 'icon-star',
        quote: 'icon-quote-right',
        guide: 'icon-map-o',
        forum: 'icon-comments',
        instagram: 'icon-instagram',
        iqs: 'icon-iqs',
    };

    public getCategory:IHeadingProviderFactory = (defaultHeading:string):IHeadingProvider => ():string => {
        if (!this._scheduledItem._categoryTag) {
            return defaultHeading;
        }
        return this._scheduledItem._categoryTag.tag;
    };

    private postTypeSwitcher = ():IFeedFormatOptions => {
        switch (this.scheduledItemType) {

            case 'Guide':
                return {
                    styleClass: 'guide',
                    icon: CycleScheduleItem.iconMap.guide,
                    heading: this.getCategory('Guide'),
                    navigable: true,
                };
            default:
                return {
                    styleClass: 'article',
                    icon: CycleScheduleItem.iconMap.article,
                    heading: this.getCategory('Article'),
                    navigable: true,
                }
        }
    };

    public __formatOptionsMap:IFeedFormatOptionsMap = {
        'headlineText': this.postTypeSwitcher,
        'headlineTextImage': this.postTypeSwitcher,
        'headlineTextImageHalf' : this.postTypeSwitcher,
        'headlineTextImageSmall' : this.postTypeSwitcher,
        'video': this.postTypeSwitcher,
        'announcement': {
            styleClass: 'announcement',
            icon: CycleScheduleItem.iconMap.announcement,
            heading: this.getCategory('Announcement'),
            navigable: false,
        },
        'quote': {
            styleClass: 'quote',
            icon: CycleScheduleItem.iconMap.quote,
            heading: this.getCategory('Quote'),
            navigable: false,
        },
        'instagram': {
            styleClass: 'instagram',
            icon: CycleScheduleItem.iconMap.instagram,
            heading: "Instagram",
            navigable: false,
        },
        'mealPlan': {
            styleClass: 'meal',
            icon: CycleScheduleItem.iconMap.calendar,
            heading: "Today's Meals",
            navigable: true,
        },
        'rating': {
            styleClass: 'rate',
            icon: CycleScheduleItem.iconMap.rate,
            heading: "Take a moment to review these meals", //@todo make dynamic?
            navigable: false,
        },
        'forum': {
            styleClass: 'forum',
            icon: CycleScheduleItem.iconMap.forum,
            heading: "Forum",
            navigable: false,
        },
        'latestIqs': {
            styleClass: 'latest',
            icon: CycleScheduleItem.iconMap.iqs,
            heading: "Latest From IQS",
            navigable: false,
        },
        'title': {
            styleClass: 'title',
            icon: null,
            heading: null,
            navigable: false,
        },
    };

    public static scheduledRelativeToTypePeriod = 'period';
    public static scheduledRelativeToTypeTimezone = 'timezone';
    public static scheduledRelativeToTypeGlobal = 'global';

    public static guideType = 'Guide';
    public static programPostType = 'ProgramPost';
    public static mealPlanType = 'MealPlan';

    protected __primaryKey = 'cycleScheduleItemId';

    protected __nestedEntityMap:INestedEntityMap = {
        _scheduledItem: this.hydrateScheduledItem,
        _options: ProgramOption
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
        scheduleDate: this.castMomentDate,
        scheduleTime: this.castTime
    };

    public cycleScheduleItemId:string;
    public programCycleId:string;

    public scheduledItemId:string;
    public scheduledItemType:string;
    public periodIndex:number;
    public scheduledRelativeTo:string; // If null, is unscheduled
    public scheduledRelativeToPeriodDays:number; // Positive is after, negative is before
    public scheduleDate:momentExtended.MomentDate; // This date and time is the local time of the user unless scheduledRelativeTo == 'global'
    public scheduleTime:moment.Duration; // When period/timezone this is local, when global this is UTC
    public stickyInFeed:boolean;
    public feedFormat:string;

    public _scheduledItem:ProgramPost|Guide;
    public _options:ProgramOption[] = [];

    public __scheduleDateTime:moment.Moment = null;
    public __display:boolean = true; // Used to determine if this item is displayed in the schedule (admin side)
    public __inView:boolean;
    public __meta:IScheduleItemMeta;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    protected hydrateScheduledItem(data:any, exists:boolean):ProgramPost|Guide|MealPlan {

        switch (this.scheduledItemType) {
            case CycleScheduleItem.guideType:
                return new Guide(data._scheduledItem, exists);
            case CycleScheduleItem.programPostType:
                return new ProgramPost(data._scheduledItem, exists);
            case CycleScheduleItem.mealPlanType:
                return new MealPlan(data._scheduledItem, exists);
        }

        return data; //default don't break
    }

    public hydrateMeta() {

        let feedFormatInfo:IFeedFormatOptions = _.result<IFeedFormatOptionsMap, IFeedFormatOptions>(this.__formatOptionsMap, this.feedFormat);
        feedFormatInfo.heading = _.result<IFeedFormatOptions, string>(feedFormatInfo, 'heading');

        if (!this.__meta) {
            this.__meta = {};
        }

        this.__meta = _.merge(this.__meta, feedFormatInfo);

        if (feedFormatInfo.navigable) {

            let stateRef:string;
            let params:any;

            switch (this.scheduledItemType) {
                case CycleScheduleItem.programPostType:
                    stateRef = postStateName;
                    params = {permalink: (<ProgramPost>this._scheduledItem).getIdentifier()};
                    break;
                case CycleScheduleItem.guideType:
                    stateRef = guideStateName;
                    params = {permalink: (<Guide>this._scheduledItem).getIdentifier()};
                    break;
                case CycleScheduleItem.mealPlanType:
                    stateRef = mealPlanStateName;
                    params = {periodIndex: null};
                    break;
            }

            this.__meta.navigator = ($stateService:ng.ui.IStateService, options:ng.ui.IStateOptions = null, extraParams:Object = {}) => {
                params = _.merge(params, extraParams);
                return $stateService.go(stateRef, params, options);
            };
        }

    }

}





