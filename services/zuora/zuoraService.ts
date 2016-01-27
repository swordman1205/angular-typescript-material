import * as angular from "angular";
import ZuoraPaymentSignature from "../../models/zuoraPaymentSignature/zuoraPaymentSignature";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {Config} from "../../../config.ts";
import "angular-load";

export const namespace = 'common.services.zuora';

export interface IZuoraWindowService extends ng.IWindowService {
    Z:ZuoraPaymentPage.ZuoraPaymentPageStatic;
}

export default class ZuoraService {

    private cachedSignature:ng.IPromise<ZuoraPaymentSignature>;
    private zuoraScriptLoaded:ng.IPromise<any>;
    static $inject:string[] = ['ngRestAdapter', 'angularLoad', '$window'];

    constructor(private ngRestAdapter:NgRestAdapterService,
                private angularLoad:ng.load.IAngularLoadService,
                private $window:IZuoraWindowService) {
    }

    private zuoraScriptLoader():ng.IPromise<any> {
        if (!this.zuoraScriptLoaded) {
            this.zuoraScriptLoaded = this.angularLoad.loadScript(Config.get('ZUORA_PAYMENT_PAGE_LIB'));
        }
        return this.zuoraScriptLoaded;
    }

    /**
     * Library source: https://apisandboxstatic.zuora.com/Resources/libs/hosted/1.3.0/zuora.js
     * @returns {IPromise<ZuoraPaymentPage.ZuoraPaymentPageStatic>}
     */
    public getZuoraPaymentPage():ng.IPromise<ZuoraPaymentPage.ZuoraPaymentPageStatic> {
        return this.zuoraScriptLoader().then((res) => {
            return this.$window.Z;
        });
    }

    /**
     * Get Zuora payment page signature.
     *
     * @returns {IPromise<ZuoraPaymentSignature>}
     */
    public getPaymentPageSignature():ng.IPromise<ZuoraPaymentSignature> {

        if (!this.cachedSignature) {
            this.cachedSignature = this.ngRestAdapter.skipInterceptor().get('/zuora/payment-page-signature')
                .then((res) => new ZuoraPaymentSignature(res.data));
        }

        return this.cachedSignature;
    }

    public clearCachedSignature():void {
        this.cachedSignature = null;
    }

}

angular.module(namespace, [
        'angularLoad', // https://github.com/urish/angular-load,
    ])
    .service('zuoraService', ZuoraService);





