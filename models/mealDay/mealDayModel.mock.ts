import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import MealDay from "./mealDayModel";
export default class MealDayMock extends AbstractMock {

    public getModelClass():IModelClass {
        return MealDay;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            mealDayId: seededChance.guid(),
            mealPeriodId: seededChance.guid(),
            mealDayIndex: seededChance.integer({min: 0, max: 7}),
            mealDayNotes: seededChance.paragraph(),
            _meals: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):MealDay {
        return <MealDay> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):MealDay[] {
        return <MealDay[]>new this().buildCollection(count, overrides, exists);
    }

}

