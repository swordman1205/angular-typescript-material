import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import Tag, {LinkingTag} from "../tag/tagModel";
import MealPlan from "../mealPlan/mealPlanModel";
import User from "../user/userModel";
import ProgramOption from "../programOption/programOptionModel";
import Program from "../program/programModel";
import SpiraException from "../../../exceptions";
import {TaggableModel} from "../../mixins/taggableModel";
import momentDate from "../../libs/moment/momentDate";
import {ProgramOptionalModel} from "../../mixins/programOptionalModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export interface IPeriodInfo {
    index:number;
    name:string;
    info:string;
}

export type TCycleStage = "Future"|"Pre Season"|"In Progress"|"Post Season"|"Ended";

export class ProgramMissingException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'ProgramMissingException';
    }
}

@changeAware
export default class Cycle extends AbstractModel implements TaggableModel, ProgramOptionalModel {

    protected __primaryKey = 'programCycleId';

    protected __nestedEntityMap:INestedEntityMap = {
        _tags: Tag,
        _mealPlans: MealPlan,
        _experts: User,
        _ambassadors: User,
        _options: ProgramOption,
        _program: Program,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
        scheduleOnSaleStart: this.castMomentDate,
        scheduleOnSaleEnd: this.castMomentDate,
        periodOneStartDate: this.castMomentDate,
        generalAccessStart: this.castMomentDate,
    };

    public programCycleId:string;
    public cycleKey:string;
    public programId:string;
    public name:string;
    public memberCount:number;
    public scheduleOnSalePreSaleDays:number = 0; // Must set defaults for these values
    public scheduleOnSaleStart:momentExtended.MomentDate = momentDate();
    public scheduleOnSaleEnd:momentExtended.MomentDate = momentDate();
    public scheduleOnSalePostSaleDays:number = 0;
    public periodOneStartDate:momentExtended.MomentDate = momentDate();
    public postSeasonDays:number = 0;
    public generalAccessStart:momentExtended.MomentDate = momentDate();
    public mealPeriodEarlyAccessDays:number = 0;
    public forumRoleName:string;
    public forumCategoryName:string;
    public forumCommentsTarget:string;
    public periodInfo:IPeriodInfo[] = [];
    public forumEnabled:boolean;

    public _experts:User[] = [];
    public _ambassadors:User[] = [];
    public _options:ProgramOption[] = [];
    public _program:Program;

    // These are used for display purposes and need to be calculated using program service
    public __cycleEndDate:momentExtended.MomentDate;
    public __cycleStage:TCycleStage;

    public _tags:LinkingTag[] = [];
    public _mealPlans:MealPlan[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Get period info for an index.
     *
     * @param index
     * @param fallback
     * @returns {IPeriodInfo}
     */
    public getPeriodInfo(index:number, fallback:IPeriodInfo = undefined):IPeriodInfo {

        let periodInfo = _.find(this.periodInfo, {index: index});

        return periodInfo ? periodInfo : fallback;

    }

    /**
     * Get the first day of sale for a cycle.
     * @returns {Moment}
     */
    public getFirstDayOfSale():moment.Moment {

        return this.scheduleOnSaleStart.clone().subtract(this.scheduleOnSalePreSaleDays, 'days');

    }

    /**
     * Get the last day of sale for a cycle.
     * @returns {Moment}
     */
    public getLastDayOfSale():moment.Moment {

        return this.scheduleOnSaleEnd.clone().add(this.scheduleOnSalePostSaleDays, 'days');

    }

    /**
     * Get the first program access day
     * @returns {Moment}
     */
    public getFirstProgramAccessDay():moment.Moment {

        return this.periodOneStartDate.clone().subtract(this.mealPeriodEarlyAccessDays, 'days');

    }

    /**
     * Get the cycleEndDate based off the periodOneStartDate
     * @returns {Moment}
     */
    public getCycleEndDate():moment.Moment {
        if (!this._program) {
            // throw exception
            throw new ProgramMissingException('This function requires a nested program to be loaded. Program Cycle Id: ' + this.programCycleId);
        }

        return moment(this.periodOneStartDate).add(this._program.periodCount * this._program.periodLength, 'days');
    }
}





