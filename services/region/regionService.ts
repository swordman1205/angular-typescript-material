import * as angular from "angular";
import * as _ from "lodash";
import {METRIC_TYPE, IMPERIAL_TYPE} from "../../models/unitConversion/unitConversion";
import {NgJwtAuthService} from "angular-jwt-auth";
import User from "../../models/user/userModel";
import RegionInterceptor from "./regionInterceptor";

export interface ISupportedRegion {
    code:string;
    name:string;
    icon?:string;
    conversion:string;
    currency:string;
    currencySymbol:string;
    paymentGateway:string;
}

export const namespace = 'common.services.region';

export const supportedRegions:ISupportedRegion[] = [
    {
        code: 'au',
        name: 'Australia',
        icon: '&#x1F1E6;&#x1F1FA;',
        //emoji: '🇦🇺',
        conversion: METRIC_TYPE,
        currency: 'AUD',
        currencySymbol: '$',
        paymentGateway: 'Braintree AU',
    },
    {
        code: 'uk',
        name: 'United Kingdom',
        icon: '&#x1F1EC;&#x1F1E7;',
        //emoji: '🇬🇧',
        conversion: METRIC_TYPE,
        currency: 'GBP',
        currencySymbol: '£',
        paymentGateway: 'Braintree UK',
    },
    {
        code: 'us',
        name: 'United States',
        icon: '&#x1F1FA;&#x1F1F8;',
        //emoji : '🇺🇸',
        conversion: IMPERIAL_TYPE,
        currency: 'USD',
        currencySymbol: '$',
        paymentGateway: 'Braintree US',
    }
];

export class RegionInit {

    static $inject:string[] = ['regionService', 'ngJwtAuthService'];

    constructor(regionService:RegionService,
                ngJwtAuthService:NgJwtAuthService) {

        ngJwtAuthService.registerLoginListener((user:User) => regionService.handleLoggedInUser(user));

    }

}

export default class RegionService {

    public supportedRegions:ISupportedRegion[];
    public currentRegion:ISupportedRegion = null;
    public userRegion:ISupportedRegion = null;

    public static defaultPaymentGateway:string = 'Braintree AU';

    static $inject:string[] = ['$state', '$timeout'];

    constructor(private $state:ng.ui.IStateService,
                private $timeout:ng.ITimeoutService) {

            this.supportedRegions = supportedRegions;
            this.currentRegion = _.find(supportedRegions, {code : 'au'});

    }

    /**
     * Set the region and reload the current state
     * @param region
     */
    public setRegion(region:ISupportedRegion):ng.IPromise<any> {

        this.currentRegion = region;

        return this.$timeout(() => {
            this.$state.go('.', {
                region: region.code
            });
        });

    }

    public handleLoggedInUser(user:User):void {

        this.userRegion = this.getRegionByCode(user.regionCode);

        if (!this.currentRegion) {
            this.currentRegion = this.userRegion;
        }

    }

    /**
     * Get the region with a supplied code
     * @param regionCode
     * @returns {ISupportedRegion}
     */
    public getRegionByCode(regionCode:String):ISupportedRegion {
        return _.find(this.supportedRegions, {code: regionCode})
    }

}

angular.module(namespace, [])
    .constant('supportedRegions', supportedRegions)
    .run(RegionInit)
    .service('regionService', RegionService)
    .service('regionInterceptor', RegionInterceptor)
    .config(['$httpProvider', '$injector', ($httpProvider:ng.IHttpProvider) => {
        $httpProvider.interceptors.push('regionInterceptor');
    }])
;




