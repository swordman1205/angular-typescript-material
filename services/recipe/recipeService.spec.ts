import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import RecipeService from "./recipeService";
import UserMock from "../../models/user/userModel.mock";
import Recipe from "../../models/recipe/recipeModel";
import RecipeMock from "../../models/recipe/recipeModel.mock";
import Section from "../../models/section/sectionModel";
import RecipeIngredientMock from "../../models/recipe/recipeIngredientModel.mock";
import DirectionMock from "../../models/direction/directionModel.mock";
import Direction from "../../models/direction/directionModel";
import RecipeGroupMock from "../../models/recipe/recipeGroupModel.mock";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import RecipeGroup from "../../models/recipe/recipeGroupModel";

describe('Recipe Service', () => {

    let recipeService:RecipeService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _recipeService_, _ngRestAdapter_, _$rootScope_) => {

            if (!recipeService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                recipeService = _recipeService_;
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

            return expect(recipeService).to.be.an('object');
        });

    });

    describe('Recipe CRUD', () => {

        it('should be able to return a new instance of a recipe', () => {

            let newRecipe = recipeService.newRecipe(UserMock.entity());

            expect(newRecipe).to.be.an.instanceOf(Recipe);

            expect(newRecipe.recipeId).to.not.be.empty;

        });

        it('should not save directions or ingredients if there are none', () => {

            let recipe = RecipeMock.entity();

            recipe._groups = [];
            recipe._ingredients = [];
            recipe._directions = [];
            recipe.updateGroupSorting();

            recipeService.save(recipe);

        });

        it("should be able to save a new recipe and it's ingredients", () => {

            let recipe = recipeService.newRecipe(UserMock.entity());

            recipe._ingredients = RecipeIngredientMock.collection(5);

            $httpBackend.expectPUT('/api/recipes/' + recipe.getKey()).respond(201);

            $httpBackend.expectPUT('/api/recipes/' + recipe.getKey() + '/sections', _.map(recipe._sections, (section:Section<any>) => section.getAttributes(true))).respond(201);

            $httpBackend.expectPUT('/api/recipes/' + recipe.getKey() + '/ingredients').respond(201);

            recipeService.save(recipe);

            $httpBackend.flush();

        });

        it('should be able to save new ingredients to an existing recipe and then not save if no ingredients have changed', () => {

            let recipe = RecipeMock.entity();
            recipe._ingredients = RecipeIngredientMock.collection(5);

            $httpBackend.expectPUT('/api/recipes/' + recipe.recipeId + '/ingredients').respond(201);

            recipeService.save(recipe);

            $httpBackend.flush();

            let savePromise = recipeService.save(recipe);

            expect(savePromise).to.eventually.deep.equal(recipe);

        });

        it("should be able to save a new recipe and it's directions", () => {

            let recipe = recipeService.newRecipe(UserMock.entity());

            recipe._directions = DirectionMock.collection(5, {}, false);

            $httpBackend.expectPUT('/api/recipes/' + recipe.recipeId).respond(201);

            $httpBackend.expectPUT('/api/recipes/' + recipe.getKey() + '/sections', _.map(recipe._sections, (section:Section<any>) => section.getAttributes(true))).respond(201);

            $httpBackend.expectPUT('/api/recipes/' + recipe.recipeId + '/directions').respond(201);

            recipeService.save(recipe);

            $httpBackend.flush();

        });

        it('should be able to save new directions to an existing recipe and not save if no directions have changed', () => {

            let recipe = RecipeMock.entity();

            recipe._directions = DirectionMock.collection(5, {}, false);

            $httpBackend.expectPUT('/api/recipes/' + recipe.recipeId + '/directions').respond(201);

            recipeService.save(recipe);

            $httpBackend.flush();

            _.forEach(recipe._directions, (direction:Direction) => {
                expect(direction.exists()).to.be.true;
            });

            let savePromise = recipeService.save(recipe);

            expect(savePromise).to.eventually.deep.equal(recipe);

        });

        it('should be able to delete a direction', () => {

            let recipe = RecipeMock.entity();

            let direction = DirectionMock.entity();

            recipe._directions = [direction];

            $httpBackend.expectDELETE('/api/recipes/' + recipe.recipeId + '/directions/' + direction.getKey()).respond(204);

            let savePromise = recipeService.deleteDirection(recipe, direction);

            $httpBackend.flush();

            expect(savePromise).to.eventually.deep.equal(true);

        });

        it('should be able to delete a group', () => {

            let recipe = RecipeMock.entity();

            let group = RecipeGroupMock.entity();

            recipe._groups = [group];

            $httpBackend.expectDELETE('/api/recipes/' + recipe.recipeId + '/groups/' + group.getKey()).respond(204);

            let savePromise = recipeService.deleteGroup(recipe, group);

            $httpBackend.flush();

            expect(savePromise).to.eventually.deep.equal(true);

        });

        /**
         * @todo resolve this failing unit test - it causes an infinite loop, probably due to a circular reference somewhere
         * the call stack suggests it somewhere there is an issue with angular.equals, possibly relating to a date object (moment?)
         */
        it.skip('should not save the recursive parent model in sections when the base recipe changes', () => {

            let recipe = recipeService.newRecipe(UserMock.entity());
            recipe.setExists(true);
            (<IChangeAwareDecorator>recipe).resetChanged();
            let newTitle = 'New Title';
            recipe.title = newTitle;

            console.log(recipe);

            $httpBackend.expectPATCH('/api/recipes/' + recipe.getKey(), {title: newTitle}).respond(204);

            let savePromise = recipeService.save(recipe);

            $httpBackend.flush();

            expect(savePromise).to.eventually.deep.equal(true);
        });

    });

    describe('Recipe Utilities', () => {

        it('should be able to create a new direction', () => {

            let direction = recipeService.newDirection(RecipeMock.entity());

            expect(direction).to.be.an.instanceOf(Direction);

        });

        it('should be able to create a new recipe group', () => {

            let mockRecipe = RecipeMock.entity();
            let recipeGroup = recipeService.newGroup(mockRecipe, 'foo');

            expect(recipeGroup).to.be.an.instanceOf(RecipeGroup);
            expect(recipeGroup.name).to.equal('foo');
            expect(recipeGroup.recipeId).to.equal(mockRecipe.getKey());

        });

        it('should be able to get the public URL of an recipe', () => {

            (<any>recipeService).getPublicUrlForEntity = sinon.stub().returns(true);

            let recipe = RecipeMock.entity();
            recipe.setExists(true);

            recipeService.getPublicUrl(recipe);

            // @Todo: Uncomment when implemented
            //expect((<any>recipeService).getPublicUrlForEntity).to.have.been.calledWith({permalink:recipe.getIdentifier()}, app.guest.articles.article.ArticleConfig.state)

        });

    });

});

