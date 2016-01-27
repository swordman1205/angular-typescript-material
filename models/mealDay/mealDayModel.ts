import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import Meal from "../meal/mealModel";

@changeAware
export default class MealDay extends AbstractModel {

    protected __primaryKey = 'mealDayId';

    protected __nestedEntityMap:INestedEntityMap = {
        _meals: this.hydrateMeals,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
        mealDayIndex: this.castNumber
    };

    public mealDayId:string;
    public mealPeriodId:string;
    public mealDayIndex:number;
    public mealDayNotes:string;
    public mealDayTitle:string;

    public mealSortOrder:string[];

    public _meals:Meal[] = [];

    public __date:moment.Moment;
    public __isPast:boolean;
    public __isToday:boolean;
    public __sortedMeals:Meal[][] = []; // Combine all adjacent meals which have 1 recipe. Used in program's meal plan.

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
        this.setSortedMeals();
    }

    private setSortedMeals():void {

        let singleRecipeMeals:Meal[] = [];

        _.forEach(this._meals, (meal:Meal) => {
            if (meal._recipes.length > 1) {
                // Add the single recipe meals we've collected first
                if (singleRecipeMeals.length > 0) {
                    this.__sortedMeals.push(singleRecipeMeals);
                    singleRecipeMeals = [];
                }

                this.__sortedMeals.push([meal]);
            }
            else {
                singleRecipeMeals.push(meal);
            }
        });

        if (singleRecipeMeals.length > 0) {
            this.__sortedMeals.push(singleRecipeMeals);
        }
    }

    public updateMealSortOrder():string[] {

        let newSortOrder = _.map<Meal, string>(this._meals, 'mealId');

        this.mealSortOrder = newSortOrder;

        return newSortOrder;

    }

    public hydrateMeals(data:any, exists:boolean):Meal[] {

        if (!_.has(data, '_meals')) {
            return;
        }

        let mealsChain = _.chain(data._meals)
            .map((entityData:any) => new Meal(entityData, exists));

        if (_.has(data, 'mealSortOrder')) {
            let sortOrder:string[] = data.mealSortOrder;
            mealsChain = mealsChain.sortBy((meal:Meal) => _.indexOf(sortOrder, meal.getKey(), false));
        }

        return mealsChain.value();
    }

}




