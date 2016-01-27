import * as _ from "lodash";
import {AbstractModel, IAttributeCastMap, INestedEntityMap} from "../abstractModel";
import Recipe from "../recipe/recipeModel";
import Cycle from "../cycle/cycleModel";
import ProgramOption from "../programOption/programOptionModel";
import MealPeriod from "../mealPeriod/mealPeriodModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";

@changeAware
export default class MealPlan extends AbstractModel {

    protected __primaryKey = 'mealPlanId';

    protected __nestedEntityMap:INestedEntityMap = {
        _mealPeriods: MealPeriod,
        _options: ProgramOption,
        _cycle: Cycle,
        _recipes: Recipe,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public mealPlanId:string;
    public programCycleId:string;
    public title:string = "Meal Plan";

    public _mealPeriods:MealPeriod[] = [];
    public _options:ProgramOption[] = [];
    public _cycle:Cycle;
    public _recipes:Recipe[] = [];
    public _pivot:IMealPlanPivot;
    
    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public getOptionCombination():string {
        return _.map<ProgramOption, string>(this._options, 'name').join('/');
    }

}

export interface IMealPlanPivot {
    status:string;
    type:string;
    userId:string;
    accessUntil:string;
    changeCount:number;
    mealPlanId:string;
    purchaseId:string;
    ratePlanName:string;
}
