import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import Article from "../../models/post/article/articleModel";
import {EntitySearchController} from "./entitySearch";
import ArticleMock from "../../models/post/article/articleModel.mock";

interface TestScope extends ng.IRootScopeService {
    testNgModel:Article;
    EntitySearchController:EntitySearchController;
}

describe('Entity search directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        $timeout:ng.ITimeoutService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:EntitySearchController,
        article:Article = ArticleMock.entity(),
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            angular.mock.inject((_$compile_, _$rootScope_, _$q_, _$timeout_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $q = _$q_;
                $timeout = _$timeout_;
            });

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testNgModel = article;

            compiledElement = $compile(`
                    <entity-search
                        ng-model="testNgModel"
                        model-type="article"
                        thumbnail="true"
                        field="title"
                        >
                    </entity-search>
                `)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).EntitySearchController;

            let stubQuery = sinon.stub();
            stubQuery.withArgs({'title': ['exists']}).returns($q.when([ArticleMock.entity()]));
            stubQuery.withArgs({'title': ['not-exists']}).returns($q.reject(true));

            (<any>directiveController).entitiesPaginator.complexQuery = stubQuery;

        }

    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('entity-search')).to.be.true;

        expect(directiveController.selectedEntities[0]).to.deep.equal(article);

    });

    it('should be able to auto-complete search for entities', () => {

        let resultsPromise = directiveController.entitySearch('exists');

        expect(resultsPromise).eventually.to.be.fulfilled;
        expect((<any>directiveController).entitiesPaginator.complexQuery).to.have.been.calledWith({
            title: ['exists']
        });

        $rootScope.$apply();

    });

    it('should be able to auto-complete search for entities and return empty array on failure', () => {

        let resultsPromise = directiveController.entitySearch('not-exists');

        expect(resultsPromise).eventually.to.deep.equal([]);

        $rootScope.$apply();

    });

    it('should call the change handler when the selected entity has been updated', () => {

        let spyHandler = sinon.spy(directiveController, 'entityChangedHandler');

        let newArticle = ArticleMock.entity();

        directiveController.selectedEntities[0] = newArticle;

        (<any>directiveController).$scope.$apply();
        (<any>directiveController).$timeout.flush();

        expect(spyHandler).to.have.been.calledWith(newArticle);
        spyHandler.restore();

    });

    it('should call the change handler when the selected entity has been removed', () => {

        let spyHandler = sinon.spy(directiveController, 'entityChangedHandler');
        directiveController.selectedEntities = [];

        (<any>directiveController).$scope.$apply();
        (<any>directiveController).$timeout.flush();

        expect(spyHandler).to.have.been.calledWith(null);
        spyHandler.restore();

    });

});

