import {expect} from "../../../testBootstrap.spec";
import ShoppingListItem from "./shoppingListItemModel";
describe('ShoppingListItem Model', () => {

    it('should instantiate a new shopping list item', () => {

        let shoppingListItem = new ShoppingListItem({
            ingredientId: 'foobar'
        });

        expect(shoppingListItem).to.be.instanceOf(ShoppingListItem);

    });

});

