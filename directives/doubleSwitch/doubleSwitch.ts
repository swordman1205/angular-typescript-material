import * as angular from "angular";

export const namespace = 'common.directives.doubleSwitch';

export interface IDoubleSwitchChangedHandler {
    (model:any):void;
}

export class DoubleSwitchController {

    public $scope:ng.IScope;
    public ngModel:ng.INgModelController;
    private doubleSwitchChangedHandler:IDoubleSwitchChangedHandler;

    public isActive(value:any):string {
        if (this.ngModel == value) {
            return 'active';
        }
    }

    public toggleSwitch():void {
        this.doubleSwitchChangedHandler(this.ngModel);
    }

    public registerDoubleSwitchChangedHandler(handler:IDoubleSwitchChangedHandler):void {
        this.doubleSwitchChangedHandler = handler;
    }
}

class DoubleSwitchDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'doubleSwitch'];
    public template = require('./doubleSwitch.tpl.html');
    public replace = false;
    public scope = {
        leftLabel: '@',
        rightLabel: '@',
        leftValue: '@',
        rightValue: '@',
        ariaLabel: '@'
    };

    public controllerAs = 'DoubleSwitchController';
    public controller = DoubleSwitchController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, DoubleSwitchController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerDoubleSwitchChangedHandler((model:any) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(model);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {
                directiveController.ngModel = $ngModelController.$modelValue;
            };
        }

        directiveController.$scope = $scope;

    };

    static factory():ng.IDirectiveFactory {
        return () => new DoubleSwitchDirective();
    }
}

angular.module(namespace, [])
    .directive('doubleSwitch', DoubleSwitchDirective.factory())
;
