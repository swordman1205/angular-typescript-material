import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import MealPeriod from "./mealPeriodModel";
export default class MealPeriodMock extends AbstractMock {

    public getModelClass():IModelClass {
        return MealPeriod;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            mealPeriodId: seededChance.guid(),
            mealPlanId: seededChance.guid(),
            mealPeriodIndex: seededChance.integer({min: 0, max: 7}),
            accessBeforePeriodStartDays: seededChance.integer({min: 1, max: 3}),
            info: seededChance.paragraph(),
            periodTitle: seededChance.word(),
            draft: seededChance.bool()
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):MealPeriod {
        return <MealPeriod> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):MealPeriod[] {
        return <MealPeriod[]>new this().buildCollection(count, overrides, exists);
    }

}

