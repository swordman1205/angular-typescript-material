import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import RecipeMock from "../../models/recipe/recipeModel.mock";
import DirectionMock from "../../models/direction/directionModel.mock";
import Recipe from "../../models/recipe/recipeModel";
import {RecipeMethodDisplayController, IRecipeMethodDirections} from "./recipeMethodDisplay";
import RecipeIngredientMock from "../../models/recipe/recipeIngredientModel.mock";
import {supportedRegions} from "../../services/region/regionService";

interface TestScope extends ng.IRootScopeService {
    RecipeMethodDisplayController:RecipeMethodDisplayController;
    testRecipe:Recipe;
}

describe('Recipe Method Display Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:RecipeMethodDisplayController,
        $window:ng.IWindowService,
        recipe:Recipe = RecipeMock.entity();

    //results in expected grouping of [[#, #, #], [*, *]]
    let directionsFixture = _.map(Array(5), (value, index) => {
        return DirectionMock.entity({
            groupId: recipe.getKey(),
            numbered: index <= 2,
        });
    });

    recipe._groups[0].__directions = directionsFixture;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$window_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $window = _$window_;

            sinon.stub($window.localStorage, 'setItem');

            sinon.stub($window.localStorage, 'getItem').returns(false);
        });

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testRecipe = recipe;

            let element = angular.element(`
                    <recipe-method-display recipe="testRecipe">
                    </recipe-method-display>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).RecipeMethodDisplayController;
        }

    });

    afterEach(() => {

        (<Sinon.SinonStub>$window.localStorage.setItem).restore();
        (<Sinon.SinonStub>$window.localStorage.getItem).restore();

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('recipe-method-display-directive')).to.be.true;

            expect(directiveController.recipe).to.deep.equal(recipe);

            let ingredientsExpectation = {
                group: _.first(recipe._groups),
                ingredients: _.first(recipe._groups).__ingredients,
            };

            expect(angular.copy(directiveController.recipeMethodIngredients[0])).to.deep.equal(angular.copy(ingredientsExpectation));

            let directionExpectation:IRecipeMethodDirections = {
                group: _.first(recipe._groups),
                directionGroups: [
                    {
                        numbered: true,
                        directions: _.take(directionsFixture, 3),
                    },
                    {
                        numbered: false,
                        directions: _.takeRight(directionsFixture, 2),
                    },
                ],
            };

            expect(angular.copy(directiveController.recipeMethodDirections[0])).to.deep.equal(angular.copy(directionExpectation));

        });

        it('should be able to set defaults', () => {

            directiveController.displayMetric = null;
            directiveController.displayMeasures = null;
            (<any>directiveController).regionService.currentRegion = null;

            (<any>directiveController).setDefaults();

            expect(directiveController.displayMetric).to.be.true;
            expect(directiveController.displayMeasures).to.be.true;

            directiveController.displayMetric = null;
            (<any>directiveController).regionService.currentRegion = _.find(supportedRegions, {code: 'us'});

            (<any>directiveController).setDefaults();

            expect(directiveController.displayMetric).to.be.false;

        });

    });

    describe('Display Preferences', () => {

        it('should be able to load display options from local storage', () => {

            expect((<any>directiveController).loadDisplayPreferences()).to.be.false;
            expect($window.localStorage.getItem).to.be.calledWith(RecipeMethodDisplayController.displayOptionsStorageKey);

            // Test the case where preferences are in local storage
            (<Sinon.SinonStub>$window.localStorage.getItem).restore();

            sinon.stub($window.localStorage, 'getItem').returns({
                displayMetric: true,
                displayMeasures: false
            });

            expect((<any>directiveController).loadDisplayPreferences()).to.be.true;
            expect((<any>directiveController).displayMetric).to.be.true;
            expect((<any>directiveController).displayMeasures).to.be.false;

        });

        it('should be able to persist changes to display options to local storage', () => {

            directiveController.displayMetric = false;
            directiveController.displayMeasures = true;

            directiveController.saveDisplayPreferences();

            expect($window.localStorage.setItem).to.be.calledWith(RecipeMethodDisplayController.displayOptionsStorageKey, angular.toJson({
                displayMetric: false,
                displayMeasures: true
            }));

        });

    });

    describe('Watchers', () => {

        it('should not update when watch has not been set', () => {

            sinon.spy(directiveController, 'organiseIngredientsDirections');

            let direction = DirectionMock.entity();
            let ingredient = RecipeIngredientMock.entity();

            directiveScope.$apply();

            directiveController.recipe._groups[0].__directions.push(direction);
            directiveController.recipe._groups[0].__ingredients.push(ingredient);

            directiveScope.$apply();

            expect((<any>directiveController).organiseIngredientsDirections).to.not.be.called;

            (<any>directiveController).organiseIngredientsDirections.restore();

        });

        it('should update the display when ingredients or directions have been modified', () => {

            let element = angular.element(`
                    <recipe-method-display recipe="testRecipe" watch="true">
                    </recipe-method-display>
                `);

            let newCompiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            let newDirectiveController = (<TestScope>newCompiledElement.isolateScope()).RecipeMethodDisplayController;

            sinon.spy(newDirectiveController, 'organiseIngredientsDirections');

            let direction = DirectionMock.entity();
            let ingredient = RecipeIngredientMock.entity();

            directiveScope.$apply();

            newDirectiveController.recipe._groups[0].__directions.push(direction); // Should not fire watch
            newDirectiveController.recipe._groups[0].__ingredients.push(ingredient); // Should not fire watch
            newDirectiveController.recipe.title = 'foobar'; // Should not fire watch

            directiveScope.$apply();

            expect((<any>newDirectiveController).organiseIngredientsDirections).to.be.calledOnce;

            (<any>newDirectiveController).organiseIngredientsDirections.restore();

        });

    });

});

