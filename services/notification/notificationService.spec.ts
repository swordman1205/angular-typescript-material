import {expect} from "../../../testBootstrap.spec";
import NotificationService, {TOAST_COLOUR_RED} from "./notificationService";

describe('Notification Service', () => {

    let notificationService:NotificationService,
        $mdToast:ng.material.IToastService,
        $rootScope:ng.IRootScopeService,
        $timeout:ng.ITimeoutService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.module(($provide) => {
            $provide.decorator('$timeout', function ($delegate) {
                return sinon.spy($delegate);
            });
        });

        angular.mock.inject((_notificationService_, _$mdToast_, _$rootScope_, _$timeout_) => {

            if (!notificationService) { // Don't rebind, so each test gets the singleton
                notificationService = _notificationService_;
                $mdToast = _$mdToast_;
                $rootScope = _$rootScope_;
                $timeout = _$timeout_;
            }

        });

    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(notificationService).to.be.an('object');
        });

    });

    describe('Toast', () => {

        beforeEach(() => {
            sinon.spy($mdToast, 'show');
        });

        afterEach(() => {
            (<any>$mdToast).show.restore();
        });

        it('should be able to override settings', () => {

            notificationService.toast('foobar').options({template: '<md-toast>New Message</md-toast>'}).pop();

            expect($mdToast.show).to.have.been.calledWith(sinon.match.has("template", sinon.match(/New Message/)));

        });

        it('should be able to show a position fixed toast', () => {

            notificationService.toast('foobar').pop();

            expect($mdToast.show).to.have.been.calledWith(sinon.match.has("template", sinon.match(/<md-toast class="md-toast-fixed green"/)));

        });

        it('should be able to show a normal toast on parent element', () => {

            notificationService.toast('foobar').options({parent: '#parent'}).pop();

            expect($mdToast.show).not.to.have.been.calledWith(sinon.match.has("template", sinon.match(/md-toast-fixed/)));
            expect($mdToast.show).to.have.been.calledWith(sinon.match.has("parent", sinon.match(/#parent/)));

        });

        it('should be able to show a delayed toast', () => {

            notificationService.toast('foobar').delay(1234).pop();

            // Check that timeout is to be called once
            expect((<any>$timeout).callCount).to.equal(1);

            // Check that the delay set in timeout is equal to 1234
            expect((<any>$timeout).args[0][1]).to.equal(1234);

            $timeout.flush();

            expect($mdToast.show).to.have.been.calledWith(sinon.match({scope: {toast: {content: 'foobar'}}}));

        });

        it('should be able to set an action which is resolved in the template', () => {

            let toast = notificationService.toast('foobar').action('testAction');
            let notificationPromise = toast.pop();

            (<any>toast).toastOptions.scope.toast.resolve();

            expect(notificationPromise).to.eventually.deep.equal('testAction');

        });

        it('should be able to change the colour of a toast', () => {

            notificationService.toast('foobar', TOAST_COLOUR_RED).pop();

            expect($mdToast.show).to.have.been.calledWith(sinon.match.has("template", sinon.match(/<md-toast class="md-toast-fixed red"/)));

        });

    });

});

