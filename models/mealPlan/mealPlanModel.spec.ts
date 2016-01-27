import {expect} from "../../../testBootstrap.spec";
import MealPlan from "./mealPlanModel";

describe('Meal Plan Model', () => {

    it('should instantiate a new meal plan', () => {

        let mealPlan = new MealPlan({});

        expect(mealPlan).to.be.instanceOf(MealPlan);

    });

});

