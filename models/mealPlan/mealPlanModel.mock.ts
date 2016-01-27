import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import MealPlan from "./mealPlanModel";
export default class MealPlanMock extends AbstractMock {

    public getModelClass():IModelClass {
        return MealPlan;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            programCycleId: seededChance.guid(),
            mealPlanId: seededChance.guid(),
            _mealPeriods: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):MealPlan {
        return <MealPlan> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):MealPlan[] {
        return <MealPlan[]>new this().buildCollection(count, overrides, exists);
    }

}

