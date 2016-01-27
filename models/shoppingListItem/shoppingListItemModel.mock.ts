import ShoppingListItem from "./shoppingListItemModel";
import IngredientMock from "../ingredient/ingredientModel.mock";
import {IModelClass} from "../abstractModel";
import {AbstractMock} from "../abstractModel.mock";
export default class ShoppingListItemMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ShoppingListItem;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let ingredient = IngredientMock.entity();

        return {

            ingredientId: ingredient.getKey(),
            _ingredient: ingredient,
            quantity: seededChance.integer({min: 30, max: 400}),
            source: [
                {
                    recipeId: seededChance.guid(),
                    servings: 2
                }
            ],
            unit: null,
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ShoppingListItem {
        return <ShoppingListItem> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):ShoppingListItem[] {
        return <ShoppingListItem[]>new this().buildCollection(count);
    }

}

