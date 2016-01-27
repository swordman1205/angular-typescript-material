import {expect} from "../../../testBootstrap.spec";
import MealLeftoverIngredient from "./mealLeftoverIngredientModel";
import RecipeIngredientMock from "../recipe/recipeIngredientModel.mock";

describe('Meal Leftover Ingredient Model', () => {

    it('should instantiate a new recipe ingredient', () => {

        let leftoverIngredient = new MealLeftoverIngredient({
            name: 'foobar'
        });

        expect(leftoverIngredient).to.be.instanceOf(MealLeftoverIngredient);

    });

    it('should be able to convert from a RecipeIngredient to a MealLeftoverIngredient', () => {

        let recipeIngredient = RecipeIngredientMock.entity({
            _pivot: {
                recipeId: 'foobar',
                groupId: 'barfoo'
            }
        });

        let leftoverIngredient = MealLeftoverIngredient.convertToMealLeftoverIngredient(recipeIngredient);

        expect(leftoverIngredient.getAttributes(false)).to.deep.equal(recipeIngredient.getAttributes(false));
        expect(leftoverIngredient._pivot.recipeId).to.equal('foobar');
        expect(leftoverIngredient._pivot.groupId).to.equal('barfoo');

    });

});

