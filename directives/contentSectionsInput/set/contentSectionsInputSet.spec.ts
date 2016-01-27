import {expect} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {ContentSectionsInputSetController} from "./contentSectionsInputSet";
import Recipe from "../../../models/recipe/recipeModel";
import SectionMock from "../../../models/section/sectionModel.mock";
import RichText from "../../../models/section/sections/richTextModel";
import IngredientsDirections from "../../../models/section/sections/ingredientsDirections";
import RecipeMock from "../../../models/recipe/recipeModel.mock";
import Section from "../../../models/section/sectionModel";

interface TestScope extends ng.IRootScopeService {
    testSectionsModel:any;
    testSectionUpdated(event, section):void;
    ContentSectionsInputSetController:ContentSectionsInputSetController;
    testRecipeModel:Recipe;
}

describe('Content sections directive set', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:ContentSectionsInputSetController,
        $q:ng.IQService,
        $httpBackend:ng.IHttpBackendService
        ;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_, _$httpBackend_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            $httpBackend = _$httpBackend_;
        });

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testSectionsModel = SectionMock.collection(5, {
                type: RichText.contentType,
            });

            $httpBackend.expectGET('/api/sections/formatting-options').respond({});

            directiveScope.testSectionUpdated = sinon.spy();

            compiledElement = $compile(`
                    <content-sections-input-set
                        ng-model="testSectionsModel"
                        on-section-update="testSectionUpdated(event, section)"
                    ></content-sections-input-set>
                `)(directiveScope);

            $httpBackend.flush();
            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).ContentSectionsInputSetController;

        }

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('content-sections-input-set')).to.be.true;

        // Should not include Ingredients & Directions section by default
        expect(_.has((<any>directiveController).sectionTypes, IngredientsDirections.contentType)).to.be.false;

    });

    it('should be able to add a new section type', () => {

        let currentSectionCount = directiveController.sections.length;

        directiveController.addSectionType(RichText.contentType);

        $rootScope.$digest();

        expect(directiveController.sections).to.have.length(currentSectionCount + 1);
        expect(directiveScope.testSectionUpdated).to.have.been.calledWith('added', sinon.match.instanceOf(Section));
        (<Sinon.SinonSpy>directiveScope.testSectionUpdated).reset();
    });

    it('should be able to remove a section', (done) => {

        let deferredShow:ng.IDeferred<any> = $q.defer();
        (<any>directiveController).$mdDialog.show = sinon.stub().returns(deferredShow.promise);

        let currentSectionCount = directiveController.sections.length;

        let removePromise = directiveController.removeSection(_.last(directiveController.sections));

        expect(removePromise).eventually.to.be.fulfilled;
        removePromise.then(() => {
            expect(directiveController.sections).to.have.length(currentSectionCount - 1);
            expect(directiveScope.testSectionUpdated).to.have.been.calledWith('deleted', sinon.match.instanceOf(Section));
            (<Sinon.SinonSpy>directiveScope.testSectionUpdated).reset();
            done();
        });

        $rootScope.$apply();
        deferredShow.resolve();
        $rootScope.$apply();


    });

    it('should be able to move a section down', () => {

        let section = _.first(directiveController.sections);

        directiveController.moveSection(section, false);

        $rootScope.$digest();

        expect(directiveController.sections[1].sectionId).to.equal(section.sectionId);
        expect(directiveScope.testSectionUpdated).to.have.been.calledWith('moved');
        (<Sinon.SinonSpy>directiveScope.testSectionUpdated).reset();

    });

    it('should be able to move a section up', () => {

        let section = _.last(directiveController.sections);

        directiveController.moveSection(section);
        expect(directiveController.sections[directiveController.sections.length - 2].sectionId).to.equal(section.sectionId);
        expect(directiveScope.testSectionUpdated).to.have.been.calledWith('moved');
        (<Sinon.SinonSpy>directiveScope.testSectionUpdated).reset();

    });

    it('should initialise sections as empty array if falsy model is provided', () => {

        let scope:TestScope = <TestScope>$rootScope.$new();

        let compiled = $compile(`
                    <content-sections-input-set
                        ng-model="testSectionsModel"
                        on-section-update="testSectionUpdated(event, section)"
                    ></content-sections-input-set>
                `)(scope);

        $rootScope.$digest();

        directiveController = (<TestScope>compiled.isolateScope()).ContentSectionsInputSetController;

        expect(directiveController.sections).to.be.instanceOf(Array);
        expect(directiveController.sections).to.be.empty;

    });

    it('should enable the Ingredients & Directions section if a recipe is passed as a parent', () => {

        let newDirectiveScope = <TestScope>$rootScope.$new();
        let recipe = RecipeMock.entity();

        $httpBackend.expectGET('/api/sections/formatting-options').respond({});
        newDirectiveScope.testSectionsModel = SectionMock.collection(5, {
            type: IngredientsDirections.contentType,
        });

        newDirectiveScope.testSectionUpdated = sinon.spy();
        newDirectiveScope.testRecipeModel = recipe;

        let newCompiledElement = $compile(`
                    <content-sections-input-set
                        ng-model="testSectionsModel"
                        on-section-update="testSectionUpdated(event, section)"
                        parent="testRecipeModel"
                    ></content-sections-input-set>
                `)(newDirectiveScope);

        $httpBackend.flush();
        $rootScope.$digest();

        let newDirectiveController = (<TestScope>newCompiledElement.isolateScope()).ContentSectionsInputSetController;

        expect(_.has((<any>newDirectiveController).sectionTypes, IngredientsDirections.contentType)).to.be.true;

    });

});

