import {expect} from "../../../testBootstrap.spec";
import Ingredient from "./ingredientModel";
import IngredientMock from "./ingredientModel.mock";
import TagMock, {LinkingTagMock} from "../tag/tagModel.mock";
describe('Ingredient Model', () => {

    it('should instantiate a new ingredient', () => {

        let ingredient = new Ingredient({
            name: 'foobar'
        });

        expect(ingredient).to.be.instanceOf(Ingredient);

    });

    it('should be able to get an ingredient identifier', () => {

        let ingredient = IngredientMock.entity();

        expect(ingredient.getIdentifier()).to.equal(ingredient.ingredientId);

    });

    it('should be able to clean the attributes', () => {

        let ingredient = IngredientMock.entity({
            measuredBy: Ingredient.measuredByVolume,
            cupSpoonMeasuresEnabled: true,
            gramsPerCup: 10,
            unitCountsEnabled: true,
            unitName: 'food',
            smallStandardWeight: 10,
            mediumStandardWeight: 11,
            largeStandardWeight: 12,
        });

        ingredient.cleanProperties();

        expect(ingredient.cupSpoonMeasuresEnabled).to.be.null;
        expect(ingredient.unitCountsEnabled).to.be.null;
        expect(ingredient.unitName).to.be.null;
        expect(ingredient.smallStandardWeight).to.be.null;
        expect(ingredient.mediumStandardWeight).to.be.null;
        expect(ingredient.largeStandardWeight).to.be.null;

        let ingredientTwo = IngredientMock.entity({
            measuredBy: Ingredient.measuredByWeight,
            unitCountsEnabled: null,
            cupSpoonMeasuresEnabled: null
        });

        ingredientTwo.cleanProperties();

        expect(ingredientTwo.unitCountsEnabled).to.be.false;
        expect(ingredientTwo.cupSpoonMeasuresEnabled).to.be.false;

    });

    it('should be able to get the super market aisle', () => {

        let ingredient = IngredientMock.entity();
        let superMarketAisleCategoryTag = TagMock.entity();
        let superMarketAisleTag = LinkingTagMock.entity({
            _pivot: {
                tagGroupId: superMarketAisleCategoryTag.tagId
            }
        });

        ingredient._tags.push(superMarketAisleTag);

        expect(ingredient.getSuperMarketAisle(superMarketAisleCategoryTag.tagId)).to.equal(superMarketAisleTag.tag);

    });

});

