import {expect, seededChance} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import Meal from "./mealModel";
import RecipeMock from "../recipe/recipeModel.mock";
import RecipeIngredientMock from "../recipe/recipeIngredientModel.mock";
import MealMock from "./mealModel.mock";
import {LEFTOVER_TYPE_NEW, ISelectedRecipeIngredient} from "./mealModel";
import RecipeIngredient from "../recipe/recipeIngredientModel";
import MealLeftoverIngredient from "./mealLeftoverIngredientModel";

describe('Meal Model', () => {

    it('should instantiate a new meal', () => {

        let meal = new Meal({
            mealTitle: 'Foobar'
        });

        expect(meal).to.be.instanceOf(Meal);

    });

    it('should fill __allRecipeIngredients on instantiation if there are _recipes', () => {

        let recipe = RecipeMock.entity();

        let meal = new Meal({
            _recipes: [recipe]
        });

        expect(meal.__allRecipeIngredients.length).to.equal(recipe._ingredients.length);
        expect(_.head(meal.__allRecipeIngredients).recipeIngredient).to.deep.equal(_.head(recipe._ingredients));

    });

    describe('Utility', () => {

        it('should be able to clean properties', () => {

            let newMeal = MealMock.entity({
                leftoverType: LEFTOVER_TYPE_NEW,
                leftoverSourceMealId: 'Foobar'
            });

            newMeal.cleanProperties();

            expect(newMeal.leftoverSourceMealId).to.be.null;
            expect(newMeal._leftoverIngredients).to.deep.equal([]);

        });

        it('should be able to set all recipe ingredients', () => {

            let recipe = RecipeMock.entity();

            let leftoverIngredient = MealLeftoverIngredient.convertToMealLeftoverIngredient(_.head(recipe._ingredients));

            let meal = new Meal({
                _recipes: [recipe],
                _leftoverIngredients: [leftoverIngredient]
            });

            expect(
                _.filter(meal.__allRecipeIngredients, (recipeIngredient:ISelectedRecipeIngredient) => {
                    return recipeIngredient.selected;
                }).length
            ).to.equal(1);

        });

    });

});

