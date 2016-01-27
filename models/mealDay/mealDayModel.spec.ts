import {expect} from "../../../testBootstrap.spec";
import MealDay from "./mealDayModel";
import Meal from "../meal/mealModel";
import MealMock from "../meal/mealModel.mock";
import RecipeMock from "../recipe/recipeModel.mock";

describe('Meal Day Model', () => {

    it('should instantiate a new meal day object', () => {

        let mealDay = new MealDay({});

        expect(mealDay).to.be.instanceOf(MealDay);

    });

    it('should be able to set sorted meals', () => {

        let mealDay = new MealDay({
            _meals: [
                MealMock.entity({
                    mealId: 'first',
                    _recipes: RecipeMock.entity()
                }),
                MealMock.entity({
                    mealId: 'second',
                    _recipes: RecipeMock.collection(2)
                }),
                MealMock.entity({
                    mealId: 'third',
                    _recipes: RecipeMock.entity()
                })
            ]
        });

        expect(mealDay.__sortedMeals.length).to.equal(3);
        expect(mealDay.__sortedMeals[0][0].mealId).to.equal('first');
        expect(mealDay.__sortedMeals[1][0].mealId).to.equal('second');
        expect(mealDay.__sortedMeals[2][0].mealId).to.equal('third');

        mealDay = new MealDay({
            _meals: [
                MealMock.entity({
                    mealId: 'first',
                    _recipes: RecipeMock.entity()
                }),
                MealMock.entity({
                    mealId: 'second',
                    _recipes: RecipeMock.entity()
                }),
                MealMock.entity({
                    mealId: 'third',
                    _recipes: RecipeMock.collection(2)
                })
            ]
        });

        expect(mealDay.__sortedMeals.length).to.equal(2);
        expect(mealDay.__sortedMeals[0][0].mealId).to.equal('first');
        expect(mealDay.__sortedMeals[0][1].mealId).to.equal('second');
        expect(mealDay.__sortedMeals[1][0].mealId).to.equal('third');

    });

});

