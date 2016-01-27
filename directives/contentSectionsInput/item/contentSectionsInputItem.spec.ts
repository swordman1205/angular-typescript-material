import {expect} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import {ContentSectionsInputItemController} from "./contentSectionsInputItem";
import SectionMock from "../../../models/section/sectionModel.mock";
import MediaMock from "../../../models/section/sections/mediaModel.mock";
import Media from "../../../models/section/sections/mediaModel";
import {MouseEventMock} from "../../../../global.mock";

interface TestScope extends ng.IRootScopeService {
    ContentSectionsInputItemController:ContentSectionsInputItemController;
    section:any;
}

describe('Content sections directive item', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        $httpBackend:ng.IHttpBackendService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:ContentSectionsInputItemController,
        $q:ng.IQService,
        parentControllerStub = {
            registerSettingsBindings: sinon.stub(),
        },
        mockBindingSettings = {
            templateUrl: '/some/path/to/a/template.tpl.html',
            controller: angular.noop,
            controllerAs: 'SomeController',
        };

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

            directiveScope.section = SectionMock.entity({
                type: Media.contentType,
                content: MediaMock.entity(),
            });

            let element = angular.element(`
                    <content-sections-input-item
                        section="section">
                    </content-sections-input-item>
                `);

            element.data('$contentSectionsInputSetController', parentControllerStub);

            $httpBackend.expectGET('/api/sections/formatting-options').respond({});

            compiledElement = $compile(element)(directiveScope);

            $httpBackend.flush();
            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).ContentSectionsInputItemController;

            (<any>directiveController).$mdBottomSheet.show = sinon.stub().returns($q.when(true));
            (<any>directiveController).$mdBottomSheet.cancel = sinon.stub().returns(undefined);
        }

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should initialise the directive', () => {

        expect($(compiledElement).children().first().hasClass('content-sections-input-item')).to.be.true;
    });

    it('should be able to register settings binding to the controller', () => {

        directiveController.registerSettingsBindings(mockBindingSettings);

        expect((<any>directiveController).childControllerSettings).to.deep.equal(mockBindingSettings);

    });

    it('should be able to prompt a bottomsheet of child directive settings to pop when requested', () => {

        directiveController.toolbarOpen = false;
        directiveController.registerSettingsBindings(mockBindingSettings);

        let sheetPromise = directiveController.toggleSettings(MouseEventMock.getMock());

        expect(directiveController.toolbarOpen).to.be.true;

        directiveScope.$digest();

        expect(directiveController.toolbarOpen).to.be.false;

        expect((<any>directiveController).$mdBottomSheet.show).to.have.been.calledWith(sinon.match({
            templateUrl: mockBindingSettings.templateUrl,
            controllerAs: mockBindingSettings.controllerAs,
            controller: sinon.match.func,
        }));

        expect(sheetPromise).eventually.to.be.fulfilled;
        (<any>directiveController).$mdBottomSheet.show.reset();

    });

    it('should be able to prompt a bottom sheet when there is no child directive with settings', () => {
        directiveController.toolbarOpen = false;
        (<any>directiveController).childControllerSettings = null;//ensure there is no child bound

        let sheetPromise = directiveController.toggleSettings(MouseEventMock.getMock());

        directiveScope.$digest();

        expect((<any>directiveController).$mdBottomSheet.show).to.have.been.calledWith(sinon.match({
            template: require('./baseSettingsMenu.tpl.html'),
        }));

        expect(sheetPromise).eventually.to.be.fulfilled;
        (<any>directiveController).$mdBottomSheet.show.reset();

    });

    it('should be able to dismiss an opened dialog', () => {

        directiveController.toolbarOpen = true;
        let closeResult = directiveController.toggleSettings(MouseEventMock.getMock());

        directiveScope.$digest();

        expect((<any>directiveController).$mdBottomSheet.cancel).to.have.been.called;

        expect(closeResult).to.equal(undefined);

        (<any>directiveController).$mdBottomSheet.cancel.reset();

    });

});

