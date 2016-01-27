import * as angular from "angular";
import * as _ from "lodash";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";
import {supportedRegions} from "../../services/region/regionService";

export const namespace = 'common.directives.ratePlanDisplay';


export class RatePlanDisplayController {

    public ratePlan:ProgramRatePlan;
    public displayCurrency:string;
    public displayPrice:string;
    public displayTotalPrice:string;
    public isSelected:boolean;

    static $inject = ['$scope', '$filter'];

    constructor(
        private $scope:ng.IScope,
        private $filter:ng.IFilterService
    ){
        this.getPriceBasedOnRegion();

        $scope.$watch(() => this.displayCurrency, (oldValue, newValue) => {
            if(angular.isDefined(oldValue)) {
                this.getPriceBasedOnRegion();
            }
        }, true);
    }

    public hasRatePlanBadge(ratePlan:ProgramRatePlan) {
        return (ratePlan.ratePlanBadgeTitle) ? 'rate-plan-badge' : '';
    }

    public getPriceBasedOnRegion() {

        let regionCurrencyAmount = _.find(this.ratePlan._currencyAmounts, {currency: this.displayCurrency});
        let currentRegion = _.find(supportedRegions, {currency: this.displayCurrency});

        if (this.ratePlan.type == ProgramRatePlan.TYPE_INSTALLMENTS) {

            //Display Price
            this.displayPrice = currentRegion.currencySymbol + regionCurrencyAmount.recurringCharge + '/week';


            //Total Price shown but in a smaller size
            let oneTimeCharge = typeof regionCurrencyAmount.oneTimeCharge !== 'undefined' ? regionCurrencyAmount.oneTimeCharge : 0;
            let totalCost:number  = +oneTimeCharge+ +(this.ratePlan.recurringCount * regionCurrencyAmount.recurringCharge);
            this.displayTotalPrice = 'Total: ' + this.$filter('currency')(totalCost, currentRegion.currencySymbol);

        } else {
            // Defaults to common.models.ProgramRatePlan.TYPE_UP_FRONT as there are no plans to have more than two payment types
            this.displayPrice = currentRegion.currencySymbol + regionCurrencyAmount.oneTimeCharge;
            this.displayTotalPrice = '';
        }
    }

    public getCheckboxTextBySelected():string {
        return this.isSelected ? "PLAN SELECTED" : "SELECT PLAN";
    }
}

class RatePlanDisplayDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ratePlanDisplay'];
    public template = require('./ratePlanDisplay.tpl.html');
    public replace = true;
    public scope = {
        ratePlan: '=',
        displayCurrency: '=',
        isSelected: '<' // One-way data binding
    };

    public controllerAs = 'RatePlanDisplayController';
    public controller = RatePlanDisplayController;
    public bindToController = true;

    static factory():ng.IDirectiveFactory {
        return () => new RatePlanDisplayDirective();
    }
}

angular.module(namespace, [])
    .directive('ratePlanDisplay', RatePlanDisplayDirective.factory())
;

