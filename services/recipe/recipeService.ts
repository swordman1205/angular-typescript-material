import * as angular from "angular";
import * as _ from "lodash";
import {MetaableApiService} from "../../mixins/metaableApiService";
import {LocalizableApiService} from "../../mixins/localizableApiService";
import {TaggableApiService} from "../../mixins/taggableApiService";
import {SectionableApiService} from "../../mixins/sectionableApiService";
import applyMixins from "../../mixins/mixins";
import PaginationService, {Paginator} from "../pagination/paginationService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import Recipe from "../../models/recipe/recipeModel";
import {PostService} from "../abstractPostService";
import ImporterService from "../importer/importerService";
import User from "../../models/user/userModel";
import IngredientsDirections from "../../models/section/sections/ingredientsDirections";
import RecipeInfoBar from "../../models/section/sections/recipeInfoBar";
import Direction from "../../models/direction/directionModel";
import RecipeGroup from "../../models/recipe/recipeGroupModel";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import Ingredient from "../../models/ingredient/ingredientModel";
import RecipeIngredient from "../../models/recipe/recipeIngredientModel";
import {IRecipeImport} from "./recipeImportInterface";

export const namespace = 'common.services.recipe';

export default class RecipeService extends PostService<Recipe> {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'importerService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                private importerService:ImporterService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newEntity(author:User):Recipe {

        return this.newRecipe(author);
    }

    /**
     * Get an instance of the Recipe given data
     * @param data
     * @returns {Recipe}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Recipe {
        return new Recipe(data, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint(recipe?:Recipe):string {
        if (recipe) {
            return '/recipes/' + recipe.recipeId;
        }
        return '/recipes';
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newRecipe(author:User):Recipe {

        let data:any = {
            recipeId: this.ngRestAdapter.uuid(),
            recipeDisplay: [],
            sectionsDisplay: {
                sortOrder: [],
            },
            draft: true,
        };

        if (author) {
            data.authorId = author.userId;
            data._author = author;
        }

        let newRecipe = new Recipe(data);

        newRecipe._sections.push(this.newSection(RecipeInfoBar.contentType, null, newRecipe));
        newRecipe._sections.push(this.newSection(IngredientsDirections.contentType, null, newRecipe));

        newRecipe.updateSectionsDisplay();

        return newRecipe;
    }

    public newDirection(recipe:Recipe):Direction {

        return new Direction({
            directionId: this.ngRestAdapter.uuid(),
            recipeId: recipe.getKey(),
            numbered: false
        });

    }

    public newGroup(recipe:Recipe, name:string = null):RecipeGroup {

        return new RecipeGroup({
            groupId: this.ngRestAdapter.uuid(),
            recipeId: recipe.getKey(),
            name: name,
            entityOrder: {
                ingredients: [],
                directions: []
            }
        });

    }

    /**
     * Returns the public facing URL for a recipe
     * @param recipe
     * @returns {string}
     */
    public getPublicUrl(recipe:Recipe):string {

        return '';
        //@todo add guest state for recipe
        //return this.getPublicUrlForEntity({permalink:recipe.getIdentifier()}, app.guest.recipes.recipe.RecipeConfig.state);
    }

    /**
     * Delete a direction. This function is normally queued.
     * @param recipe
     * @param direction
     * @returns {IPromise<boolean>}
     */
    public deleteDirection(recipe:Recipe, direction:Direction):ng.IPromise<boolean> {

        return this.ngRestAdapter.remove('/recipes/' + recipe.recipeId + '/directions/' + direction.getKey())
            .then(() => {
                return true;
            });

    }

    /**
     * Delete a group. This function is normally queued.
     * @param recipe
     * @param direction
     * @returns {IPromise<boolean>}
     */
    public deleteGroup(recipe:Recipe, group:RecipeGroup):ng.IPromise<boolean> {

        return this.ngRestAdapter.remove('/recipes/' + recipe.recipeId + '/groups/' + group.getKey())
            .then(() => {
                return true;
            });

    }

    /**
     * Save all the related entities concurrently
     * @param recipe
     * @returns {IPromise<any[]>}
     */
    protected saveRelatedEntities(recipe:Recipe):ng.IPromise<any> {

        return this.$q.all([ // Save all related entities
            this.saveRecipeGroups(recipe).then(() => this.$q.all([ //due to dependency of ingredients/directions, groups must be saved first
                this.saveRecipeIngredients(recipe),
                this.saveRecipeDirections(recipe),
            ])),
            this.saveEntitySections(recipe),
            this.saveEntityLocalizations(recipe),
            this.saveEntityTags(recipe),
            this.runQueuedSaveFunctions()
        ]);

    }

    /**
     * Save the groups to the recipe.
     * @param recipe
     * @returns {any}
     */
    private saveRecipeGroups(recipe:Recipe):ng.IPromise<RecipeGroup[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>recipe).getChanged(true), '_groups')) {
            return this.$q.when(false);
        }

        let recipeGroups = this.getNestedCollectionRequestObject(recipe, '_groups', false, false);

        if (_.isEmpty(recipeGroups)) {
            return this.$q.when(false);
        }

        return this.ngRestAdapter.put('/recipes/' + recipe.recipeId + '/groups', recipeGroups)
            .then(() => {
                return recipe._groups;
            });

    }

    /**
     * Save the ingredients to the recipe.
     * @param recipe
     * @returns {any}
     */
    private saveRecipeIngredients(recipe:Recipe):ng.IPromise<Ingredient[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>recipe).getChanged(true), '_ingredients')) {
            return this.$q.when(false);
        }

        let recipeIngredients = this.getNestedCollectionRequestObject(recipe, '_ingredients', false, false);

        if (_.isEmpty(recipeIngredients)) {
            return this.$q.when(false);
        }

        _.forEach(recipeIngredients, (recipeIngredient:RecipeIngredient) => {
            delete recipeIngredient._metricInputOptions;
            // @Todo: Fix API so that amount is cast to a number so we don't need to remove this anymore
            delete recipeIngredient._pivot.__attributeCastMap;
        });

        return this.ngRestAdapter.put('/recipes/' + recipe.recipeId + '/ingredients', recipeIngredients)
            .then(() => {
                return recipe._ingredients;
            });

    }

    /**
     * Save the directions to the recipe.
     * @param recipe
     * @returns {any}
     */
    private saveRecipeDirections(recipe:Recipe):ng.IPromise<Direction[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>recipe).getChanged(true), '_directions')) {
            return this.$q.when(false);
        }

        let directions = this.getNestedCollectionRequestObject(recipe, '_directions', false);

        if (_.isEmpty(directions)) {
            return this.$q.when(false);
        }

        return this.ngRestAdapter.put('/recipes/' + recipe.recipeId + '/directions', directions)
            .then(() => {
                _.invokeMap(recipe._directions, 'setExists', true);

                return recipe._directions;
            });

    }

    public importRecipe(recipeId:string):ng.IPromise<IRecipeImport> {

        return this.importerService.importData(recipeId)
            .then((importData:IRecipeImport) => {

                return this.ngRestAdapter
                    .skipInterceptor()
                    .get('/recipes/legacy-id/' + importData.wpId)
                    .then((res) => {
                        return this.$q.reject({
                            message: 'Already imported',
                            recipe: this.modelFactory(res.data),
                        });
                    }, () => importData)
                    ;
            }, (error:ng.IHttpPromiseCallbackArg<any>) => this.$q.reject(error.data))
    }

    public getAvailableMealPlanRecipes(mealPlanId:string, nestedEntities:string[] = []):ng.IPromise<Recipe[]> {
        return this.getAllModels<Recipe>(nestedEntities, `/meal-plans/${mealPlanId}/recipes/available`);
    }

}

applyMixins(RecipeService, [SectionableApiService, TaggableApiService, LocalizableApiService, MetaableApiService]);

angular.module(namespace, [])
    .service('recipeService', RecipeService);





