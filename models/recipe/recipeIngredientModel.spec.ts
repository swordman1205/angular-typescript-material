import {expect} from "../../../testBootstrap.spec";
import RecipeIngredient from "./recipeIngredientModel";
describe('Recipe Ingredient Model', () => {

    it('should instantiate a new recipe ingredient', () => {

        let recipeIngredient = new RecipeIngredient({
            name: 'foobar'
        });

        expect(recipeIngredient).to.be.instanceOf(RecipeIngredient);

    });

    it('should be able to retrieve the display name of the recipe ingredient', () => {

        let recipeIngredient = new RecipeIngredient({
            name: 'foobar'
        });

        expect(recipeIngredient.getName()).to.equal('foobar');

        recipeIngredient._pivot.nameOverride = 'barfoo';

        expect(recipeIngredient.getName()).to.equal('barfoo');

    });

});

