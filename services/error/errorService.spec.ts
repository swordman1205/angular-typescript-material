import {expect} from "../../../testBootstrap.spec";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import ErrorService, {ErrorDialogController, namespace} from "./errorService";
import {namespace as notFound} from "../../../app/error/notFound/notFound";

describe('Error Service', () => {

    let errorService:ErrorService,
        $q:ng.IQService,
        $timeout:ng.ITimeoutService,
        $mdDialog:ng.material.IDialogService,
        $httpBackend:ng.IHttpBackendService,
        $rootScope:ng.IRootScopeService,
        ngRestAdapter:NgRestAdapterService,
        errorDialogController:ErrorDialogController,
        $log:ng.ILogService,
        $state:ng.ui.IStateService,
        $location:ng.ILocationService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$rootScope_, $controller, _$httpBackend_, _$q_, _$timeout_, _$mdDialog_, _errorService_, _ngRestAdapter_, _$log_, _$state_, _$location_) => {

            if (!errorService) { // Don't rebind, so each test gets the singleton
                $rootScope = _$rootScope_;
                $httpBackend = _$httpBackend_;
                errorService = _errorService_;
                ngRestAdapter = _ngRestAdapter_;
                $q = _$q_;
                $timeout = _$timeout_;
                $mdDialog = _$mdDialog_;
                $log = _$log_;
                $state = _$state_;
                $location = _$location_;

                $location.path = sinon.stub().returns({
                    replace: sinon.stub()
                });
            }

            errorDialogController = $controller(namespace + '.controller', {
                $mdDialog: $mdDialog,
                title: "test title",
                message: "test message",
                extra: {
                    key: 'value'
                },
            });

        });

        sinon.spy($log, 'error');

    });

    afterEach(() => {

        (<any>$log.error).restore();

    });

    it('should pop a dialog when requested', () => {

        sinon.spy($mdDialog, 'show');

        $httpBackend.expectPOST((url:string):boolean => {
            return !!url.match('/.*logs\-01\.loggly\.com\/inputs\/.*Angular.*/');
        }).respond(200);

        errorService.showError("Test title", "test message");

        $timeout.flush();

        expect($mdDialog.show).to.have.been.calledWithMatch({
            locals: {
                title: "Test title",
                message: "test message",
            }
        });

        expect($log.error).to.be.calledWith('Test title', 'test message');

        (<Sinon.SinonSpy>$mdDialog.show).restore();

        $httpBackend.flush();

    });

    it('should be able to redirect to an error page', () => {

        errorService.redirectNotFoundPage();

        expect($location.path).to.be.calledWith($state.href(notFound));

    });

    it('should be able to cancel the error dialog on creation', () => {

        sinon.spy($mdDialog, 'cancel');
        errorDialogController.cancelErrorDialog();

        expect($mdDialog.cancel).to.have.been.called;

        (<Sinon.SinonSpy>$mdDialog.cancel).restore();

    });

    describe('API Errors', () => {

        it('should trigger an error dialog when an api responds with error', () => {

            sinon.spy(errorService, 'showError');

            $httpBackend.expectGET('/api/a-failing-endpoint').respond(500, {
                message: "Api error message",
            });

            $httpBackend.expectPOST((url:string):boolean => {
                return !!url.match('/.*logs\-01\.loggly\.com\/inputs\/.*Angular.*/');
            }).respond(200);

            ngRestAdapter.get('/a-failing-endpoint');

            $httpBackend.flush();
            $timeout.flush();

            expect(errorService.showError).to.have.been.calledWithMatch(sinon.match.string, "Api error message", sinon.match.object);

            expect($log.error).to.be.calledWith(sinon.match.string, "Api error message", sinon.match.object);

            (<Sinon.SinonSpy>errorService.showError).restore();

        });

        it('should trigger an error dialog with a default message when the api does not provide one', () => {

            sinon.spy(errorService, 'showError');

            $httpBackend.expectGET('/api/a-failing-endpoint').respond(500);

            $httpBackend.expectPOST((url:string):boolean => {
                return !!url.match('/.*logs\-01\.loggly\.com\/inputs\/.*Angular.*/');
            }).respond(200);

            ngRestAdapter.get('/a-failing-endpoint');

            $httpBackend.flush();
            $timeout.flush();

            expect(errorService.showError).to.have.been.calledWithMatch(sinon.match.string, "No response message", sinon.match.object);

            expect($log.error).to.be.calledWith(sinon.match.string, "No response message", sinon.match.object);

            (<Sinon.SinonSpy>errorService.showError).restore();

        });

    });

});

