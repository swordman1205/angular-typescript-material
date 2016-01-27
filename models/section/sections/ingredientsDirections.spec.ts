import {expect} from "../../../../testBootstrap.spec";
import IngredientsDirectionsMock from "./ingredientsDirections.mock";
import IngredientsDirections from "./ingredientsDirections";
describe('IngredientsDirections Model', () => {

    it('should instantiate a new IngredientsDirections', () => {

        let ingredientsDirectionsData = (new IngredientsDirectionsMock()).getMockData();

        let ingredientsDirections = new IngredientsDirections(ingredientsDirectionsData);

        expect(ingredientsDirections).to.be.instanceOf(IngredientsDirections);

    });

    it('should mock a section promo', () => {

        expect(IngredientsDirectionsMock.entity()).to.be.instanceOf(IngredientsDirections);

    });

});

