import {expect} from "../../../testBootstrap.spec";
import MealPeriod, {MealPeriodException} from "./mealPeriodModel";
import MealPeriodMock from "./mealPeriodModel.mock";
import CycleMock from "../cycle/cycleModel.mock";
import MealDayMock from "../mealDay/mealDayModel.mock";

describe('Meal Period Model', () => {

    it('should instantiate a new meal period', () => {

        let mealPeriod = new MealPeriod({});

        expect(mealPeriod).to.be.instanceOf(MealPeriod);

    });

    it('should throw an exception when unable to determine if it\'s meals can be accessed', () => {

        let mealPeriod = MealPeriodMock.entity(),
            cycle = CycleMock.entity();

        let throwableFunction = () => {
            mealPeriod.canAccessMeals(cycle);
        };

        expect(throwableFunction).to.throw(MealPeriodException);

    });

    it('should be able to determine if it\'s meals can be accessed', () => {

        let today = moment();

        let mealPeriod = MealPeriodMock.entity(),
            cycle = CycleMock.entity({
                mealPeriodEarlyAccessDays: 4
            }),
            mealDay = MealDayMock.entity();

        mealDay.__date = today.clone().add(2, 'd');

        mealPeriod._mealDays.push(mealDay);

        expect(mealPeriod.canAccessMeals(cycle, today)).to.be.true;

        mealDay.__date = today.clone().add(5, 'd');

        expect(mealPeriod.canAccessMeals(cycle, today)).to.be.false;

    });

});

