import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../abstractApiService";
import {LocalizableApiService} from "../../mixins/localizableApiService";
import {TaggableModel} from "../../mixins/taggableModel";
import Tag from "../../models/tag/tagModel";
import {LocalizableModel} from "../../mixins/localizableModel";
import Localization from "../../models/localization/localizationModel";
import Ingredient from "../../models/ingredient/ingredientModel";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import DietaryRestriction from "../../models/dietary/dietaryRestrictionModel";
import applyMixins from "../../mixins/mixins";
import {TaggableApiService} from "../../mixins/taggableApiService";

export const namespace = 'common.services.ingredient';

export default class IngredientService extends AbstractApiService implements TaggableApiService, LocalizableApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q'];

    //TaggbleApiService
    public saveEntityTags:(entity:TaggableModel) => ng.IPromise<Tag[]|boolean>;

    //LocalizableApiService
    public saveEntityLocalizations:(entity:LocalizableModel) => ng.IPromise<Localization<any>[]|boolean>;

    /**
     * Get an instance of the Ingredient given data
     * @param data
     * @returns {Ingredient}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Ingredient {
        return new Ingredient(data, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint(ingredient?:Ingredient):string {
        if (ingredient) {
            return '/ingredients/' + ingredient.ingredientId;
        }
        return '/ingredients';
    }

    /**
     * Get a new ingredient with no values and a set uuid
     * @returns {Ingredient}
     */
    public newIngredient(data:any = {}):Ingredient {

        data = _.merge({
            ingredientId: this.ngRestAdapter.uuid()
        }, data);

        return new Ingredient(data);

    }

    /**
     * Returns the public facing URL for an article
     * @param ingredient
     * @returns {string}
     */
    public getPublicUrl(ingredient:Ingredient):string {

        return null; //No public url for ingredients exists
    }

    /**
     * Save the ingredient
     * @param ingredient
     * @returns {IPromise<Ingredient>}
     */
    public save(ingredient:Ingredient):ng.IPromise<Ingredient> {

        ingredient.cleanProperties();

        return this.saveModel(ingredient)
            .then(() => this.$q.all([
                this.saveRelatedEntities(ingredient),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>ingredient).resetChanged(); // Reset so next save only saves the changed ones
                ingredient.setExists(true);
                return ingredient;
            });

    }

    /**
     * Get a list of applicable recipe badges from a list of ingredients.
     * @param ingredients
     */
    public getBadges(ingredients:Ingredient[]):ng.IPromise<Tag[]> {

        let ingredientIds = _.map(ingredients, 'ingredientId');

        return this.ngRestAdapter.get(this.apiEndpoint() + '/dietary-restriction-badges?ingredientIds=' + JSON.stringify(ingredientIds))
            .then((res) => {
                return _.map(res.data, (modelData) => new Tag(modelData, true));
            });

    }

    /**
     * Save all the related entities concurrently
     * @param ingredient
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(ingredient:Ingredient):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntityTags(ingredient),
            this.saveEntityLocalizations(ingredient),
            this.saveIngredientDietaryRestrictions(ingredient),
        ]);

    }

    /**
     * Save the dietary restriction data
     * @param ingredient
     * @returns {any}
     */
    protected saveIngredientDietaryRestrictions(ingredient:Ingredient):ng.IPromise<DietaryRestriction[]|boolean> {

        let requestObject = this.getNestedCollectionRequestObject(ingredient, '_dietaryRestrictions', true, false, ['dietaryRestrictionId']);

        return this.ngRestAdapter.put(this.apiEndpoint(ingredient) + '/dietary-restrictions', requestObject)
            .then(() => {
                _.invokeMap(ingredient._dietaryRestrictions, 'setExists', true);
                return ingredient._dietaryRestrictions;
            });

    }

    /**
     * Returns the most commonly used ingredients
     * @returns {IPromise<Ingredient[]>}
     */
    public getCommonIngredients():ng.IPromise<Ingredient[]> {

        return this.getAllModels(null, '/ingredients/common-conversions');
    }

}

applyMixins(IngredientService, [TaggableApiService, LocalizableApiService]);

angular.module(namespace, [])
    .service('ingredientService', IngredientService);





