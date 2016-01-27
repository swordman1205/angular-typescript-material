import * as _ from "lodash";
import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Meal from "./mealModel";
import {LEFTOVER_TYPE_NEW, LEFTOVER_TYPE_COMPLETE, LEFTOVER_TYPE_PARTIAL} from "./mealModel";

export default class MealMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Meal;
    }

    public getMockData():Object {

        let seededChance:Chance.Chance = new Chance();

        return {
            mealId: seededChance.guid(),
            mealDayId: seededChance.guid(),
            mealTitle: seededChance.word(),
            recipeId: seededChance.guid(),
            leftoverType: seededChance.pick([LEFTOVER_TYPE_NEW, LEFTOVER_TYPE_COMPLETE, LEFTOVER_TYPE_PARTIAL]),
            leftoverSourceMealId: seededChance.guid(),
            mandatory: seededChance.bool(),
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Meal {
        return <Meal> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):Meal[] {
        return <Meal[]>new this().buildCollection(count);
    }

}