import {expect} from "../../../testBootstrap.spec";
import {Config} from "../../../config.ts";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import ZuoraService from "./zuoraService";
import ZuoraPaymentSignatureMock from "../../models/zuoraPaymentSignature/zuoraPaymentSignature.mock";

describe('Zuora Service', () => {

    let zuoraService:ZuoraService,
        $httpBackend:ng.IHttpBackendService,
        ngRestAdapter:NgRestAdapterService,
        $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app', ($provide:ng.auto.IProvideService) => {

            $provide.decorator('angularLoad', ['$delegate', '$q', ($delegate:ng.load.IAngularLoadService, $q:ng.IQService) => {

                $delegate.loadScript = sinon.stub().withArgs(Config.get('ZUORA_PAYMENT_PAGE_LIB')).returns($q.when(true));

                return $delegate;
            }]);

        });

        angular.mock.inject((_$httpBackend_, _zuoraService_, _ngRestAdapter_, _$rootScope_) => {
            $httpBackend = _$httpBackend_;
            zuoraService = _zuoraService_;
            ngRestAdapter = _ngRestAdapter_;
            $rootScope = _$rootScope_;
        });

    });

    afterEach(() => {

        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(zuoraService).to.be.an('object');
        });

    });

    describe('Utility', () => {

        it('should be able to get the payment page library', () => {

            let res = zuoraService.getZuoraPaymentPage();

            expect((<any>zuoraService).angularLoad.loadScript).to.have.been.calledWith(Config.get('ZUORA_PAYMENT_PAGE_LIB'));

            expect(res).eventually.to.be.fulfilled;

        });

        it('should be able to get the payment page library, without re-calling the script', () => {

            //load once
            zuoraService.getZuoraPaymentPage();

            expect((<any>zuoraService).angularLoad.loadScript).to.have.been.calledWith(Config.get('ZUORA_PAYMENT_PAGE_LIB'));

            (<any>zuoraService).angularLoad.loadScript.reset();

            //load second time
            let res = zuoraService.getZuoraPaymentPage();

            expect((<any>zuoraService).angularLoad.loadScript).not.to.have.been.called;

            expect(res).eventually.to.be.fulfilled;
        });

        let zuoraPaymentPageSignature = ZuoraPaymentSignatureMock.entity();

        it('should be able to get a payment page signature', () => {

            $httpBackend.expectGET('/api/zuora/payment-page-signature').respond(zuoraPaymentPageSignature);

            let promise = zuoraService.getPaymentPageSignature();

            expect(promise).eventually.to.be.fulfilled;
            expect(promise).eventually.to.deep.equal(zuoraPaymentPageSignature);

            $httpBackend.flush();

        });

        it('should be able to re-retrieve the signature from cache', () => {

            $httpBackend.expectGET('/api/zuora/payment-page-signature').respond(zuoraPaymentPageSignature);
            //load once
            zuoraService.getPaymentPageSignature();

            $httpBackend.flush();

            //load second time
            let promise = zuoraService.getPaymentPageSignature();

            expect(promise).eventually.to.be.fulfilled;
            expect(promise).eventually.to.deep.equal(zuoraPaymentPageSignature);

        });

        it('should be able to clear the signature cache', () => {

            (<any>zuoraService).cachedSignature = 'foo';

            expect((<any>zuoraService).cachedSignature).not.to.be.null;

            zuoraService.clearCachedSignature();

            expect((<any>zuoraService).cachedSignature).to.be.null;

        });

    });

});

