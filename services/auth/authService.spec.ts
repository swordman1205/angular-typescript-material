import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import AuthService from "./authService";
import NotificationService from "../notification/notificationService";
import {NgJwtAuthService} from "angular-jwt-auth";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import UserSocialLogin from "../../models/user/userSocialLoginModel";
import UserMock from "../../models/user/userModel.mock";
import User from "../../models/user/userModel";

let authService:AuthService,
    ngJwtAuthService:NgJwtAuthService,
    $q:ng.IQService,
    $location:ng.ILocationService,
    $timeout:ng.ITimeoutService,
    $mdDialog:ng.material.IDialogService,
    $state:ng.ui.IStateService,
    notificationService:NotificationService,
    ngRestAdapter:NgRestAdapterService,
    $window:ng.IWindowService,
    $httpBackend:ng.IHttpBackendService,
    $rootScope:ng.IRootScopeService;

describe('Auth Service', () => {

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.module(($provide) => {

            $window = <any> {
                // $window.location.href will update that empty object
                location: {},
                // Required functions
                document: window.document,
                localStorage: window.localStorage,
                encodeURIComponent: (<any>window).encodeURIComponent
            };

            // We register our new $window instead of the old
            $provide.constant('$window', $window);

        });

        angular.mock.inject((_$httpBackend_, _authService_, _ngJwtAuthService_, _$q_, _$location_, _$timeout_, _$mdDialog_, _$state_, _notificationService_, _ngRestAdapter_, _$rootScope_) => {

            if (!authService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                authService = _authService_;
                ngJwtAuthService = _ngJwtAuthService_;
                $q = _$q_;
                $location = _$location_;
                $timeout = _$timeout_;
                $mdDialog = _$mdDialog_;
                $state = _$state_;
                notificationService = _notificationService_;
                ngRestAdapter = _ngRestAdapter_;
                $rootScope = _$rootScope_;
            }

            $location.path = sinon.stub().returns('/foobar');

        });

    });

    describe('Social logins', () => {

        it('should be able to log in using a social network', () => {

            let provider = UserSocialLogin.facebookType;

            authService.socialLogin(provider);

            expect($window.location.href).to.equal('/auth/social/facebook?returnUrl=%2Ffoobar');

        });

        it('should be able to unlink a social network', () => {

            let user = UserMock.entity(),
                provider = UserSocialLogin.facebookType;

            $httpBackend.expectDELETE('/api/users/' + user.userId + '/socialLogin/' + provider).respond(204);

            let unlinkSocialPromise = authService.unlinkSocialLogin(user, provider);

            expect(unlinkSocialPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

    });

    describe('User impersonation', () => {

        beforeEach(() => {
            $window.localStorage.clear();
        });

        it('should be able to load impersonation object from storage', () => {

            let originalUser = UserMock.entity();
            let impersonatedUser = UserMock.entity();
            let impersonationJson = angular.toJson({
                originalUser: originalUser,
                originalUserToken: 'this-is-a-token',
                impersonatedUser: impersonatedUser
            });
            let localStorageGetItem = sinon.stub($window.localStorage, 'getItem');
            localStorageGetItem.withArgs(AuthService.impersonationStorageKey).returns(impersonationJson);

            authService.loadStoredImpersonation();

            expect(authService.impersonation).not.to.be.null;

            expect(authService.impersonation.impersonatedUser).to.be.instanceOf(User);
            expect(authService.impersonation.impersonatedUser.userId).to.equal(impersonatedUser.userId);

            expect(authService.impersonation.originalUser).to.be.instanceOf(User);
            expect(authService.impersonation.originalUser.userId).to.equal(originalUser.userId);

            expect(authService.impersonation.originalUserToken).to.equal('this-is-a-token');

            localStorageGetItem.restore();
        });

        it('should not attempt to restore when there is not impersonation object in storage', () => {

            authService.impersonation = null; //restore to the initial state
            let restorePromise = authService.restoreFromImpersonation();

            $rootScope.$apply();

            expect(restorePromise).eventually.to.be.rejected;

        });

        it('should be able to impersonate a user', () => {

            let originalUser = UserMock.entity();
            let impersonateUser = UserMock.entity();

            ngJwtAuthService.getUser = sinon.mock().returns(originalUser);

            let localStorageSetItem = sinon.stub($window.localStorage, 'setItem');
            let loginAsUserCall = sinon.stub(ngJwtAuthService, 'loginAsUser');

            authService.impersonateUser(impersonateUser);

            expect(loginAsUserCall).to.have.been.calledWith(impersonateUser.userId);
            expect(localStorageSetItem).to.have.been.calledWith(AuthService.impersonationStorageKey, sinon.match.string);

            localStorageSetItem.restore();
            loginAsUserCall.restore();
        });

        it('should be able to restore an impersonation, reload the state and refresh the original user token', () => {

            let originalUser = UserMock.entity();
            let impersonateUser = UserMock.entity();

            ngJwtAuthService.getUser = sinon.mock().returns(originalUser);

            let localStorageSetItem = sinon.stub($window.localStorage, 'setItem');
            let localStorageRemoveItem = sinon.stub($window.localStorage, 'removeItem');
            let loginAsUserCall = sinon.stub(ngJwtAuthService, 'loginAsUser');
            let processNewTokenStub = sinon.stub(ngJwtAuthService, 'processNewToken');
            let refreshTokenStub = sinon.stub(ngJwtAuthService, 'refreshToken');
            let stateReloadStub = sinon.stub($state, 'reload');

            authService.impersonateUser(impersonateUser);

            processNewTokenStub.withArgs(authService.impersonation.originalUserToken).returns($q.when(true));

            let restorePromise = authService.restoreFromImpersonation();

            $rootScope.$apply();

            expect(localStorageRemoveItem).to.have.been.called;
            expect(stateReloadStub).to.have.been.called;
            expect(refreshTokenStub).to.have.been.called;
            expect(restorePromise).eventually.to.be.fulfilled;
            expect(authService.impersonation).to.be.null;

            localStorageSetItem.restore();
            loginAsUserCall.restore();
            processNewTokenStub.restore();
            refreshTokenStub.restore();

        });

    });

});

