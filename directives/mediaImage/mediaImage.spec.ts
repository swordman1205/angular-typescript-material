import {expect} from "../../../testBootstrap.spec";
import {MediaImageController} from "./mediaImage";
import Image from "../../models/image/imageModel";
import ImageMock from "../../models/image/imageModel.mock";

interface TestScope extends ng.IRootScopeService {
    testImage:Image;
    MediaImageController:MediaImageController;
}

describe('Select media image directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:MediaImageController,
        $q:ng.IQService,
        mockImage:Image = ImageMock.entity()
        ;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_, _$mdDialog_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;

        });

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testImage = null;

            compiledElement = $compile(`
                    <media-image
                        ng-model="testImage">
                    </media-image>
                `)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).MediaImageController;

            let stubbedShow = sinon.stub();
            stubbedShow.returns($q.when(mockImage));
            (<any>directiveController).$mdDialog.show = stubbedShow;
        }

    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('ng-untouched')).to.be.true;
    });

    it('should prompt a dialog that resolves a new image when confirmed', () => {

        expect(directiveScope.testImage).to.be.null;

        directiveController.promptMediaImageDialog('upload');

        directiveScope.$apply();

        expect((<any>directiveController).$mdDialog.show).to.have.been.called;
        expect(directiveController.currentImage).to.be.instanceOf(Image);
        expect(directiveScope.testImage).to.be.instanceOf(Image);

    });

});

