import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import RecipeMock from "../../models/recipe/recipeModel.mock";
import Recipe from "../../models/recipe/recipeModel";
import {RecipeSelectController} from "./recipeSelect";

interface TestScope extends ng.IRootScopeService {
    testNgModel:Recipe;
    RecipeSelectController:RecipeSelectController;
}

describe('Recipe select directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:RecipeSelectController,
        recipe:Recipe = RecipeMock.entity(),
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        });

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testNgModel = recipe;

            compiledElement = $compile(`
                    <recipe-select
                        ng-model="testNgModel">
                    </recipe-select>
                `)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).RecipeSelectController;

            (<any>directiveController).recipesPaginator.complexQuery = sinon.stub().returns($q.when(RecipeMock.entity()));

            (<any>directiveController).$mdDialog.hide = sinon.stub();
            (<any>directiveController).$mdDialog.show = sinon.stub().returns($q.when(true));
            (<any>directiveController).recipeChangedHandler = sinon.stub();

        }

    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('recipe-select')).to.be.true;

        expect(directiveController.selectedRecipes[0]).to.deep.equal(recipe);

    });

    it('should be able to auto-complete search for recipes', () => {

        let resultsPromise = directiveController.recipeSearch('foobar');

        expect(resultsPromise).eventually.to.be.fulfilled;
        expect((<any>directiveController).recipesPaginator.complexQuery).to.have.been.calledWith({
            title: ['foobar']
        });

    });

    it('should be able to close the dialog', () => {

        directiveController.closeDialog();

        expect((<any>directiveController).$mdDialog.hide).to.have.been.called;

    });

    it('should be able to open the dialog', () => {

        directiveController.openDialog();

        expect((<any>directiveController).$mdDialog.show).to.have.been.calledWith({
            template: require('./recipeSelectDialog.tpl.html'),
            scope: (<any>directiveController).$scope,
            preserveScope: true,
            clickOutsideToClose: true
        });

    });

    it('should call the change handler when the selected recipe has been updated', () => {

        let newRecipe = RecipeMock.entity();

        directiveController.selectedRecipes[0] = newRecipe;

        (<any>directiveController).$scope.$apply();

        expect((<any>directiveController).recipeChangedHandler).to.have.been.called;

        expect((<any>directiveController).$mdDialog.hide).to.have.been.called;

    });

    it('should remove the recipe when it has been removed through the dialog', () => {

        directiveController.selectedRecipes = [];

        (<any>directiveController).$scope.$apply();

        expect((<any>directiveController).recipeChangedHandler).to.have.been.calledWith(null);

        expect((<any>directiveController).$mdDialog.hide).to.have.been.called;

    });

});

