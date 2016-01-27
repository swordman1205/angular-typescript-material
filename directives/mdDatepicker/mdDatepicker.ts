import * as angular from "angular";
import * as _ from "lodash";
import momentDate from "../../libs/moment/momentDate";
import {momentExtended as moment} from "../../libs/moment/moment";

export const namespace = 'common.directives.mdDatepicker';

export interface IDatePickerCtrl {
    configureNgModel(ngModelCtrl:ng.INgModelController):void;
    ngModelCtrl:ng.INgModelController;
    date:momentExtended.MomentDate;
    inputElement:any;
    resizeInputElement():void;
    updateErrorState():void;
    dateLocale:any;

    attachChangeListeners():void;
    closeCalendarPane():void;
    $scope:ng.IScope;
}

/**
 * Stacking directive md-datepicker to allow it to work with momentDate objects
 */
class MdDatepickerDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'mdDatepicker'];

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, IDatePickerCtrl]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        // Override configureNgModel to allow moment/momentDate input
        directiveController.configureNgModel = (ngModelCtrl:ng.INgModelController) => {

            directiveController.ngModelCtrl = ngModelCtrl;
            ngModelCtrl.$render = function() {
                directiveController.date = directiveController.ngModelCtrl.$viewValue;
                directiveController.inputElement.value = directiveController.dateLocale.formatDate(directiveController.ngModelCtrl.$viewValue);
                directiveController.resizeInputElement();
                directiveController.updateErrorState();
            };

            // Register md-calendar-change event
            directiveController.$scope.$on('md-calendar-change', (event, date) => {
                var mDDate = momentDate(date);

                directiveController.ngModelCtrl.$setViewValue(mDDate);
                directiveController.date = mDDate;
                directiveController.inputElement.value = directiveController.dateLocale.formatDate(date);
                directiveController.closeCalendarPane();
                directiveController.resizeInputElement();
                directiveController.updateErrorState();
            });
        };

        directiveController.attachChangeListeners = () => {
        };

    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new MdDatepickerDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('mdDatepicker', MdDatepickerDirective.factory());

