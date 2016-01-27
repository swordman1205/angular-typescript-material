import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {PaymentMethodController} from "./paymentMethod";
import ZuoraPaymentSignature from "../../models/zuoraPaymentSignature/zuoraPaymentSignature";
import User from "../../models/user/userModel";
import ZuoraPaymentMethod from "../../models/zuoraPaymentMethod/zuoraPaymentMethodModel";
import ZuoraPaymentSignatureMock from "../../models/zuoraPaymentSignature/zuoraPaymentSignature.mock";
import ZuoraPaymentMethodMock from "../../models/zuoraPaymentMethod/zuoraPaymentMethodModel.mock";
import UserMock from "../../models/user/userModel.mock";
import ZuoraService from "../../services/zuora/zuoraService";

interface TestScope extends ng.IRootScopeService {
    testModel:ZuoraPaymentMethod;
    testUser:User;
    testPaymentSignature:ZuoraPaymentSignature;
    testAllowNew:boolean;
    PaymentMethodController:PaymentMethodController;
}

describe('Payment Method Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        PaymentMethodController:PaymentMethodController,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        $q:ng.IQService;

    // Mocks
    let zuoraPaymentSignature = ZuoraPaymentSignatureMock.entity();
    let mockZppSuccess:ZuoraPaymentPage.ZuoraPaymentPageStatic = {
        render: (params, initFields, callback) => {
            return callback({
                success: 'true',
                refId: 'foobar'
            });
        }
    };
    let zuoraPaymentPageStub = mockZppSuccess;
    let zuoraPaymentPageSignatureStub;

    beforeEach(() => {

        // Only initialise the directive once to speed up the testing
        if (!PaymentMethodController) {

            angular.mock.module('app', ($provide:ng.auto.IProvideService) => {

                $provide.decorator('$mdDialog', ['$delegate', '$q', ($delegate:ng.material.IDialogService, $q:ng.IQService) => {

                    $delegate.show = sinon.stub().returns($q.when(true)); //immediate resolve as if it were user input

                    return $delegate;
                }]);

                $provide.decorator('zuoraService', ['$delegate', '$q', ($delegate:ZuoraService, $q:ng.IQService) => {

                    $delegate.getPaymentPageSignature = zuoraPaymentPageSignatureStub;
                    $delegate.getZuoraPaymentPage = sinon.stub().returns($q.when(zuoraPaymentPageStub));

                    return $delegate;
                }]);

            });

            angular.mock.inject((_$compile_, _$rootScope_, _$q_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $q = _$q_;
            });

            zuoraPaymentPageSignatureStub = sinon.stub().returns($q.when(zuoraPaymentSignature));

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testModel = ZuoraPaymentMethodMock.entity();
            directiveScope.testAllowNew = true;

            compiledElement = $compile(`
                        <payment-method ng-model="testModel"
                                        user="testUser"
                                        allow-new="testAllowNew">
                        </payment-method>
                    `)(directiveScope);

            $rootScope.$apply();

            PaymentMethodController = (<TestScope>compiledElement.isolateScope()).PaymentMethodController;

            (<any>PaymentMethodController).paymentMethodChangedHandler = sinon.stub();

        }

    });

    describe('Initialization', () => {

        it('should have initialized', () => {

            //note only the stubs that were defined by the $delegate provider can be asserted against as the other stubs
            //are defined after the insantiation of the directive
            expect((<any>PaymentMethodController).zuoraService.getPaymentPageSignature).to.have.been.called;
            expect((<any>PaymentMethodController).zuoraService.getZuoraPaymentPage).to.have.been.called;

            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'standby', 'loadingPortal', 'awaitingInput', 'saved', 'standby']);

        });

        it('should throw an alert dialog when there is an error', () => {

            let callableError = (<any>PaymentMethodController).dismissableErrorNoticeFactory("Error", 'foo');

            let consoleErrorStub = sinon.stub(console, 'error');

            callableError();

            $rootScope.$apply();

            expect(consoleErrorStub).to.have.been.calledWith("Error", 'foo');
            expect((<any>PaymentMethodController).$mdDialog.show).to.be.called;

            consoleErrorStub.restore();
        });

        it('should initialize a new user when the user propery changes', () => {

            PaymentMethodController.clearPaymentStatusLog();

            PaymentMethodController.user = UserMock.entity({
                zuoraAccountId: 'foobar'
            });

            $rootScope.$apply();

            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;

            expect(PaymentMethodController.statusLog).to.deep.equal(['userChanged']);
        });

    });

    describe('Change Payment Method', () => {

        beforeEach(() => {

            PaymentMethodController.clearPaymentStatusLog();

            //deregister the scope watcher to stop changes to the user triggering event flows
            if (_.isFunction(PaymentMethodController.scopeWatchDeregister)) {
                PaymentMethodController.scopeWatchDeregister();
            }

        });

        it('should run prompt for update when the user is changed to one without an account', () => {

            sinon.spy((<any>PaymentMethodController).userService, 'updatePaymentMethod');

            PaymentMethodController.user = UserMock.entity();

            //imitate $scope.$watch event
            PaymentMethodController.userChanged();
            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['userChanged', 'loadingSignature', 'loadingPortal', 'awaitingInput', 'saved', 'standby']);

            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;

            expect((<any>PaymentMethodController).userService.updatePaymentMethod).not.to.have.been.called;
            expect((<any>PaymentMethodController).paymentMethodChangedHandler).to.have.been.calledWith(new ZuoraPaymentMethod({Id: "foobar"}));

            (<any>PaymentMethodController).userService.updatePaymentMethod.restore();
        });

        it('should not save update when user is changed to one with a zuora account', () => {

            sinon.spy((<any>PaymentMethodController).userService, 'updatePaymentMethod');

            PaymentMethodController.user = UserMock.entity({
                zuoraAccountId: 'foobar'
            });

            //imitate $scope.$watch event
            PaymentMethodController.userChanged();

            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['userChanged']);
            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;
            expect((<any>PaymentMethodController).userService.updatePaymentMethod).not.to.have.been.called;

            (<any>PaymentMethodController).userService.updatePaymentMethod.restore();

        });

        it('should update user payment method when existing user changes their payment method', () => {

            (<any>PaymentMethodController).userService.updatePaymentMethod = sinon.stub().returns($q.when(true));
            (<any>PaymentMethodController).userService.getPaymentMethod = sinon.stub().returns($q.when(ZuoraPaymentMethodMock.entity()));

            PaymentMethodController.user = UserMock.entity({
                zuoraAccountId: 'foobar'
            });

            PaymentMethodController.changePaymentMethod();

            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'loadingPortal', 'awaitingInput', 'saved', 'standby']);
            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;
            expect((<any>PaymentMethodController).userService.updatePaymentMethod).to.have.been.called;
            expect((<any>PaymentMethodController).userService.getPaymentMethod).to.have.been.calledWith(PaymentMethodController.user);

        });

        it('should log error when existing user changes their payment method, but saving it fails', () => {

            (<any>PaymentMethodController).userService.updatePaymentMethod = sinon.stub().returns($q.reject('error!'));

            PaymentMethodController.user = UserMock.entity({
                zuoraAccountId: 'foobar'
            });

            let consoleErrorStub = sinon.stub(console, 'error');

            PaymentMethodController.changePaymentMethod();
            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'loadingPortal', 'awaitingInput', 'error']);
            expect(consoleErrorStub).to.have.been.calledWith("Your payment method was not changed successfully, please try again.", 'error!');

            expect((<any>PaymentMethodController).userService.updatePaymentMethod).to.have.been.called;

            consoleErrorStub.restore();

        });

        it('should be able to cancel setting a new payment method', () => {

            PaymentMethodController.user = UserMock.entity({
                zuoraAccountId: 'foobar'
            });

            PaymentMethodController.useExistingPaymentMethod();
            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['standby']);
            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;

        });

        it('should log an error when the payment portal processing fails', () => {

            let failingZRenderMock = {
                render: (params, initFields, callback) => {
                    return callback({
                        success: 'false',
                    });
                }
            };

            let failingPaymentDetailsStub = sinon.stub().returns($q.when(failingZRenderMock));
            (<any>PaymentMethodController).zuoraService.getZuoraPaymentPage = failingPaymentDetailsStub;

            let consoleErrorStub = sinon.stub(console, 'error');

            PaymentMethodController.changePaymentMethod();
            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'loadingPortal', 'awaitingInput', 'error']);
            expect(consoleErrorStub).to.have.been.calledWith("Unable to process payment method, please try again later", {
                success: 'false',
            });

            expect(failingPaymentDetailsStub).to.have.been.calledOnce;
            consoleErrorStub.restore();

        });

        it('should log an error when the payment portal script retrieval fails', () => {

            let failingPaymentPortalStub = sinon.stub().returns($q.reject("Failed!"));
            (<any>PaymentMethodController).zuoraService.getZuoraPaymentPage = failingPaymentPortalStub;

            let consoleErrorStub = sinon.stub(console, 'error');

            PaymentMethodController.changePaymentMethod();
            $rootScope.$apply();

            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'loadingPortal', 'error']);
            expect(consoleErrorStub).to.have.been.calledWith("Unable to load payment portal, please try again later", "Failed!");

            expect(failingPaymentPortalStub).to.have.been.calledOnce;
            consoleErrorStub.restore();

        });

        it('should log an error when the payment page signature call fails', () => {

            let failingGetPaymentPageSignatureStub = sinon.stub().returns($q.reject('failed!'));
            (<any>PaymentMethodController).zuoraService.getPaymentPageSignature = failingGetPaymentPageSignatureStub;

            let consoleErrorStub = sinon.stub(console, 'error');

            PaymentMethodController.changePaymentMethod();
            $rootScope.$apply();

            expect(consoleErrorStub).to.have.been.calledWith("Could not retrieve remote portal signature.", "failed!");
            expect(failingGetPaymentPageSignatureStub).to.have.been.calledOnce;

            consoleErrorStub.restore();
            expect(PaymentMethodController.statusLog).to.deep.equal(['loadingSignature', 'error']);

        });

    });

    describe('model change payment method', () => {

        it('should update the controller model when the ngModel changes in parent scope', () => {

            PaymentMethodController.isUsingExistingPaymentMethod = false;

            directiveScope.testModel = null;

            $rootScope.$apply();

            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.false;

            directiveScope.testModel = ZuoraPaymentMethodMock.entity({
                PaymentMethodStatus: 'Active',
            });

            $rootScope.$apply();

            expect(PaymentMethodController.isUsingExistingPaymentMethod).to.be.true;
            expect(PaymentMethodController.paymentMethod).to.deep.equal(directiveScope.testModel);

        });

    });

    describe('helper functions', () => {

        it('should be able to set the status of the directive, pushing the status into a log', () => {

            PaymentMethodController.clearPaymentStatusLog();
            expect(PaymentMethodController.statusLog).to.be.empty;

            (<any>PaymentMethodController).setStatus('standby');
            expect(PaymentMethodController.status).to.equal('standby');
            expect(PaymentMethodController.statusLog).to.deep.equal(['standby']);

            (<any>PaymentMethodController).setStatus('awaitingInput');
            expect(PaymentMethodController.status).to.equal('awaitingInput');
            expect(PaymentMethodController.statusLog).to.deep.equal(['standby', 'awaitingInput']);

            PaymentMethodController.clearPaymentStatusLog();
            expect(PaymentMethodController.statusLog).to.be.empty;

        });

        it('should be able to check if the directive is loading', () => {

            (<any>PaymentMethodController).setStatus('loadingPortal');
            expect(PaymentMethodController.isLoading()).to.be.true;

            (<any>PaymentMethodController).setStatus('standby');
            expect(PaymentMethodController.isLoading()).to.be.false;

        });

        it('should be able to determine whether the zuora section should be visible', () => {

            (<any>PaymentMethodController).setStatus('standby');
            expect(PaymentMethodController.zuoraSectionVisible()).to.be.false;

            (<any>PaymentMethodController).setStatus('awaitingInput');
            expect(PaymentMethodController.zuoraSectionVisible()).to.be.true;

        });

    });

});

