import * as angular from "angular";
import * as _ from "lodash";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";

export const namespace = 'common.directives.ratePlanSelect';

export interface IRatePlanChangedHandler {
    (ratePlan:ProgramRatePlan):void;
}

export class RatePlanSelectController {

    public ratePlans:ProgramRatePlan[];
    public displayCurrency:string;
    public selectedRatePlanType:string;
    public selectedRatePlan:ProgramRatePlan;
    private ratePlanChangedHandler:IRatePlanChangedHandler;
    public displayAll:boolean = false;

    static $inject = ['$analytics'];

    constructor() {
        // Special case - we want to display all if there are two types with one plan each ie display both options
        if (this.ratePlans.length == 2 && _.uniq(_.map(this.ratePlans, 'type')).length == 2) {
            this.displayAll = true;
        }
    }

    public registerRatePlanChangedHandler(handler:IRatePlanChangedHandler):void {
        this.ratePlanChangedHandler = handler;
    }

    public selectRatePlan(ratePlan:ProgramRatePlan):void {
        this.selectedRatePlan = ratePlan;
        this.ratePlanChangedHandler(this.selectedRatePlan);
    }

    public isSelected(ratePlan:ProgramRatePlan):boolean {
        if (!this.selectedRatePlan) {
            return false;
        }
        return ratePlan.ratePlanId == this.selectedRatePlan.ratePlanId;
    }
}

class RatePlanSelectDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'ratePlanSelect'];
    public template = require('./ratePlanSelect.tpl.html');
    public replace = true;
    public scope = {
        ratePlans: '=',
        displayCurrency: '=',
        selectedRatePlanType: '='
    };

    public controllerAs = 'RatePlanSelectController';
    public controller = RatePlanSelectController;
    public bindToController = true;

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, RatePlanSelectController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerRatePlanChangedHandler((ratePlan:ProgramRatePlan) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(ratePlan);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                directiveController.selectedRatePlan = $ngModelController.$modelValue;

            };

        }

    };

    static factory():ng.IDirectiveFactory {
        return () => new RatePlanSelectDirective();
    }
}

angular.module(namespace, [])
    .directive('ratePlanSelect', RatePlanSelectDirective.factory())
;

