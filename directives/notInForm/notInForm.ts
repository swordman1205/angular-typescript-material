import * as angular from "angular";

export const namespace = 'common.directives.notInForm';

class NotInFormDirective implements ng.IDirective {

    public restrict = 'A';
    public require = ['ngModel', '^form'];
    public replace = false;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, ng.IFormController]) => {

        let $ngModelController = $controllers[0];
        let $formController = $controllers[1];

        if ($ngModelController) {

            $formController.$removeControl($ngModelController);

        }

    };

    static factory():ng.IDirectiveFactory {
        return () => new NotInFormDirective();
    }
}

angular.module(namespace, [])
    .directive('notInForm', NotInFormDirective.factory())
;

