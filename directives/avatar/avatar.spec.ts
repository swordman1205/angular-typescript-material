import {expect} from "../../../testBootstrap.spec";
import User from "../../models/user/userModel";
import {AvatarController} from "./avatar";
import UserMock from "../../models/user/userModel.mock";
import ImageMock from "../../models/image/imageModel.mock";

interface TestScope extends ng.IRootScopeService {
    testUser:User;
    testUserAvatarId:string;
    AvatarController:AvatarController;
}

describe('Change Avatar Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        AvatarController:AvatarController,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        });

        // Only initialise the directive once to speed up the testing
        if (!AvatarController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testUser = UserMock.entity({
                _uploadedAvatar: ImageMock.entity()
            });

            directiveScope.testUserAvatarId = directiveScope.testUser.avatarImgId;

            compiledElement = $compile(`
                        <avatar user="testUser" ng-model="testUserAvatarId"></avatar>
                    `)(directiveScope);

            $rootScope.$digest();

            AvatarController = (<TestScope>compiledElement.isolateScope()).AvatarController;

            (<any>AvatarController).$mdDialog.show = sinon.stub().returns($q.when(true));
            (<any>AvatarController).$mdDialog.hide = sinon.stub();
            (<any>AvatarController).avatarChangedHandler = sinon.stub();

        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('avatar-directive')).to.be.true;

            expect(AvatarController.canEdit).to.be.true;

            expect(AvatarController.width).to.equal(200);

            expect(AvatarController.height).to.equal(200);

        });

        it('should not be able to edit the avatar by default', () => {

            let displayOnlyCompiledElement:ng.IAugmentedJQuery = $compile(`
                    <avatar user="testUser"></avatar>
                `)(directiveScope);

            $rootScope.$digest();

            let DisplayOnlyAvatarController = (<TestScope>displayOnlyCompiledElement.isolateScope()).AvatarController;

            expect(DisplayOnlyAvatarController.canEdit).to.be.false;

        });

        it('should be able to set the avatar dimensions', () => {

            let displayOnlyCompiledElement:ng.IAugmentedJQuery = $compile(`
                    <avatar user="testUser" width="100" height="150"></avatar>
                `)(directiveScope);

            $rootScope.$digest();

            let DisplayOnlyAvatarController = (<TestScope>displayOnlyCompiledElement.isolateScope()).AvatarController;

            expect(DisplayOnlyAvatarController.width).to.equal(100);

            expect(DisplayOnlyAvatarController.height).to.equal(150);

        });

    });

    describe('Dialog functions', () => {

        it('should be able to open the avatar dialog', () => {

            AvatarController.openAvatarDialog();

            $rootScope.$digest();

            expect((<any>AvatarController).$mdDialog.show).to.be.called;
        });

        it('should be able to close the avatar dialog', () => {

            AvatarController.closeAvatarDialog();

            $rootScope.$digest();

            expect((<any>AvatarController).$mdDialog.hide).to.be.called;
        });

    });

    describe('Avatar functions', () => {

        it('should be able to save the update to the avatar', () => {

            let seededChance = new Chance();

            let imageId = seededChance.guid();

            AvatarController.updatedAvatar(imageId);

            $rootScope.$digest();

            expect((<any>AvatarController).avatarChangedHandler).to.be.calledWith(imageId);

            expect((<any>AvatarController).$mdDialog.hide).to.be.called;

        });

        it('should be able to remove the avatar', () => {

            let removePromise = AvatarController.removeAvatar();

            $rootScope.$digest();

            expect((<any>AvatarController).$mdDialog.show).to.be.called;

            removePromise.then(() => {

                expect((<any>AvatarController).avatarChangedHandler).to.be.calledWith(null);

                expect((<any>AvatarController).$mdDialog.hide).to.be.called;

            });

        });

    });

});

