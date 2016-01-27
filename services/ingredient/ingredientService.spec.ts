import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import IngredientService from "./ingredientService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import Ingredient from "../../models/ingredient/ingredientModel";
import IngredientMock from "../../models/ingredient/ingredientModel.mock";
import TagMock from "../../models/tag/tagModel.mock";
import DietaryRestrictionMock from "../../models/dietary/dietaryRestrictionModel.mock";
(() => {

    describe('Ingredient Service', () => {

        let ingredientService:IngredientService;
        let $httpBackend:ng.IHttpBackendService;
        let ngRestAdapter:NgRestAdapterService;
        let $rootScope:ng.IRootScopeService;

        beforeEach(() => {

            angular.mock.module('app');

            angular.mock.inject((_$httpBackend_, _ingredientService_, _ngRestAdapter_, _$rootScope_) => {

                if (!ingredientService) { // Don't rebind, so each test gets the singleton
                    $httpBackend = _$httpBackend_;
                    ingredientService = _ingredientService_;
                    ngRestAdapter = _ngRestAdapter_;
                    $rootScope = _$rootScope_;
                }
            });

        });

        afterEach(() => {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('Initialisation', () => {

            it('should be an injectable service', () => {

                return expect(ingredientService).to.be.an('object');
            });

        });

        describe('New Ingredient', () => {

            it('should be able to return a new instance of an ingredient', () => {

                let newIngredient = ingredientService.newIngredient();

                expect(newIngredient).to.be.an.instanceOf(Ingredient);

                expect(newIngredient.ingredientId).to.not.be.empty;

            });

        });

        describe('Badges', () => {

            it('should be able to get applicable badges based on a set of ingredients', () => {

                let ingredients = IngredientMock.collection(5);

                let query = JSON.stringify(
                    _.map(ingredients, (ingredient) => {
                        return ingredient.ingredientId;
                    })
                );

                $httpBackend.expectGET('/api/ingredients/dietary-restriction-badges?ingredientIds=' + query).respond(
                    TagMock.collection(6)
                );

                ingredientService.getBadges(ingredients);

                $httpBackend.flush();

            });

        });

        describe('Save', () => {

            it('should be able to save an ingredient and it\'s nested entities', () => {

                let ingredient = IngredientMock.entity();

                let dietaryRestrictions = DietaryRestrictionMock.collection(4);

                ingredient._dietaryRestrictions = dietaryRestrictions;

                $httpBackend.expectPATCH('/api/ingredients/' + ingredient.ingredientId).respond(201);

                $httpBackend.expectPUT('/api/ingredients/' + ingredient.ingredientId + '/dietary-restrictions').respond(201);

                let savePromise = ingredientService.save(ingredient);

                expect(savePromise).eventually.to.be.fulfilled;
                expect(savePromise).eventually.to.deep.equal(ingredient);

                $httpBackend.flush();
            });

        });

        describe('Utility', () => {

            it('should be able to get common ingredients', () => {

                $httpBackend.expectGET('/api/ingredients/common-conversions').respond(200);

                let promise = ingredientService.getCommonIngredients();

                expect(promise).eventually.to.be.fulfilled;

                $httpBackend.flush();

            });

        });

    });

})();