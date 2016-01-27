import {expect} from "../../../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {SectionInputMediaController} from "./sectionInputMedia";
import SectionMock from "../../../../models/section/sectionModel.mock";
import MediaMock from "../../../../models/section/sections/mediaModel.mock";
import Media, {IImageContent} from "../../../../models/section/sections/mediaModel";
import ImageMock from "../../../../models/image/imageModel.mock";

interface TestScope extends ng.IRootScopeService {
    section:any;
    SectionInputMediaController:SectionInputMediaController;
}

describe('Section input media directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        $httpBackend:ng.IHttpBackendService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:SectionInputMediaController,
        $q:ng.IQService,
        parentControllerStub = {
            registerSettingsBindings: sinon.stub(),
        }
        ;

    beforeEach(() => {

        angular.mock.module('app');

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            angular.mock.inject((_$compile_, _$rootScope_, _$q_, _$httpBackend_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $q = _$q_;
                $httpBackend = _$httpBackend_;
            });

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.section = SectionMock.entity({
                type: Media.contentType,
                content: MediaMock.entity(),
            });

            let element = angular.element(`
                    <section-input-media
                        section="section"
                    ></section-input-media>
                `);

            element.data('$contentSectionsInputItemController', parentControllerStub);
            element.data('$contentSectionsInputSetController', sinon.stub());

            $httpBackend.expectGET('/api/sections/formatting-options').respond({});

            compiledElement = $compile(element)(directiveScope);

            $httpBackend.flush();

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).SectionInputMediaController;

            let stubbedShow = sinon.stub();
            stubbedShow.onCall(0).returns($q.when(true));
            (<any>directiveController).$mdDialog.show = stubbedShow;

        }

    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('section-input-media')).to.be.true;
        expect(parentControllerStub.registerSettingsBindings).to.have.been.called;
    });

    it('should be able to add a media section', () => {

        let currentImageCount = directiveController.section.content.media.length;

        directiveController.addMedia();

        expect(directiveController.section.content.media).to.have.length(currentImageCount + 1);
    });

    it('should be able to remove a media section with prompt', (done) => {

        let currentImageCount = directiveController.section.content.media.length;

        let removePromise = directiveController.removeMedia(_.last(directiveController.section.content.media));

        expect(removePromise).eventually.to.be.fulfilled;
        removePromise.then(() => {
            expect(directiveController.section.content.media).to.have.length(currentImageCount - 1);
            done();
        });

        $rootScope.$apply();

    });

    it('should default an image content caption to the images alt tag when image is changed and no caption is set', () => {

        let tabCount = directiveController.addMedia();
        let newImageTab = <IImageContent>directiveController.section.content.media[tabCount - 1];

        expect(newImageTab.caption).to.be.null;

        newImageTab._image = ImageMock.entity();
        directiveController.imageChanged(newImageTab);

        expect(newImageTab.caption).to.equal(newImageTab._image.alt);
    });

    it('should be able to move a media item left', () => {

        let mediaItem = _.first(directiveController.section.content.media);

        directiveController.moveMedia(mediaItem, false);

        $rootScope.$digest();

        expect(directiveController.section.content.media[1]).to.deep.equal(mediaItem);

    });

    it('should be able to move a media item right', () => {

        let mediaItem = _.last(directiveController.section.content.media);

        directiveController.moveMedia(mediaItem);

        $rootScope.$digest();

        expect(directiveController.section.content.media[directiveController.section.content.media.length - 2]).to.deep.equal(mediaItem);

    });

});

