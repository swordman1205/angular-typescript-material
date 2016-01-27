import * as angular from "angular";
import * as _ from "lodash";
import ShoppingListItem from "../../models/shoppingListItem/shoppingListItemModel";
import {AbstractApiService} from "../abstractApiService";
import SpiraException from "../../../exceptions";
import MealPeriod from "../../models/mealPeriod/mealPeriodModel";
import Meal from "../../models/meal/mealModel";
import Tag, {LinkingTag} from "../../models/tag/tagModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../pagination/paginationService";

export const namespace = 'common.services.shoppingList';

export interface IShoppingListItemAisle {
    shoppingListItems:ShoppingListItem[];
    supermarketAisle:Tag;
    hidden:boolean;
}

export class ShoppingListServiceException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'ShoppingListServiceException';
    }
}

export default class ShoppingListService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q'];

    /**
     * Get an instance of the Shoppinglist given data
     * @param data
     * @returns {ShoppingListItem}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):ShoppingListItem {
        return new ShoppingListItem(data, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint():string {
        return '/shopping-lists';
    }

    public getShoppingList(meals:Meal[], bustCache:boolean = false):ng.IPromise<IShoppingListItemAisle[]> {

        if (meals.length < 1) {
            return this.$q.when([]);
        }

        let headers:ng.HttpHeaderType = {
            'Base64-Encoded-Fields': 'q',
            'With-Nested': 'supermarketAisles'
        };

        if (bustCache) {
            headers['Bust-Cache'] = 'true';
        }

        return this.ngRestAdapter.get(this.apiEndpoint() + '?q=' + this.getQueryStringFromMeals(meals), headers)
            .then((res) => {
                return this.arrangeShoppingList(_.map(res.data, (shoppingListItemData) => this.modelFactory(shoppingListItemData)));
            });
    }

    private arrangeShoppingList(shoppingListItems:ShoppingListItem[]):IShoppingListItemAisle[] {

        let arrangedShoppingListItems:IShoppingListItemAisle[] = [];

        _.forEach(shoppingListItems, (shoppingListItem:ShoppingListItem) => {

            if (shoppingListItem._ingredient._supermarketAisles.length != 1) {
                throw new ShoppingListServiceException('Ingredient ' + shoppingListItem._ingredient.name + ' (' + shoppingListItem._ingredient.ingredientId + ') has the wrong number of supermarket aisle tags.');
            }

            let supermarketAisle = _.head(shoppingListItem._ingredient._supermarketAisles);

            let shoppingListItemAisle:IShoppingListItemAisle = _.find(arrangedShoppingListItems, {supermarketAisle: {tagId: supermarketAisle.tagId}});

            if (!shoppingListItemAisle) {
                arrangedShoppingListItems.push(<IShoppingListItemAisle>{
                    supermarketAisle: supermarketAisle,
                    shoppingListItems: [shoppingListItem],
                    hidden: false
                });
            }
            else {
                shoppingListItemAisle.shoppingListItems.push(shoppingListItem);
            }

        });

        return arrangedShoppingListItems;
    }

    private getQueryStringFromMeals(meals:Meal[]):string {
        return btoa(JSON.stringify(_.map(meals, (meal:Meal) => {
            return {
                mealId: meal.mealId,
                servings: null // @Todo: Set default recipe servings for now, allow users to set servings later
            };
        })));
    }

    public getDownloadLink(meals:Meal[], friendlyName, bustCache:boolean = false):ng.IPromise<string> {

        if (meals.length < 1) {
            return;
        }

        let headers:ng.HttpHeaderType = {
            'Base64-Encoded-Fields': 'q',
            'With-Nested': 'supermarketAisles'
        };

        if (bustCache) {
            headers['Bust-Cache'] = 'true';
        }

        return this.ngRestAdapter.get(this.apiEndpoint() + '/pdf?q=' + this.getQueryStringFromMeals(meals) + '&friendly_name=' + friendlyName, headers)
            .then((res) => {
                // format is {'url':'http://...'}
                return res.data
            });
    }
}

angular.module(namespace, [])
    .service('shoppingListService', ShoppingListService);





