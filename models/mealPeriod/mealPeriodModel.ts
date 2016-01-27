import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import MealDay from "../mealDay/mealDayModel";
import Cycle from "../cycle/cycleModel";
import SpiraException from "../../../exceptions";

export class MealPeriodException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'MealPeriodException';
    }
}

@changeAware
export default class MealPeriod extends AbstractModel {

    protected __primaryKey = 'mealPeriodId';

    protected __nestedEntityMap:INestedEntityMap = {
        _mealDays: MealDay
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public mealPeriodId:string;
    public mealPlanId:string;

    public mealPeriodIndex:number;
    public accessBeforePeriodStartDays:number;
    public info:string;
    public periodTitle:string;
    public draft:boolean;

    public _mealDays:MealDay[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public canAccessMeals(cycle:Cycle, date:moment.Moment = moment()):boolean {

        if (_.isEmpty(this._mealDays)) {
            throw new MealPeriodException('No meal days present in meal period');
        }

        return date.isAfter(_.first(this._mealDays).__date.clone().subtract(cycle.mealPeriodEarlyAccessDays, 'd'));

    }

}

