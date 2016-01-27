import * as angular from "angular";
import * as _ from "lodash";
import * as $ from "jquery";

import "drop-ng";
import "tether-drop/dist/css/drop-theme-arrows-bounce.css";
import "tether-drop/dist/css/drop-theme-arrows-bounce-dark.css";

export const namespace = 'common.directives.commandWidget';

export interface IInvalidControl {
    label:string;
    element:JQuery;
}

export class CommandWidgetController {

    private formReference:ng.IFormController;
    public invalidControls:IInvalidControl[] = [];

    public hasDelete:boolean;
    public hasSave:boolean;
    public hasCancel:boolean;

    static $inject = ['$timeout'];

    constructor(private $timeout:ng.ITimeoutService) {
    }

    public onSavePopover() {
        this.updateInvalidControls();
    }

    private updateInvalidControls() {

        this.invalidControls = _.reduce($('.ng-invalid:not(ng-form,[ng-form])'), (controls:IInvalidControl[], controlElement:JQuery) => {

            let elem = $(controlElement);

            let label:string = elem.siblings('label').text();

            // Use placeholder if no label
            if (!label) {
                label = elem.attr('placeholder');
            }
            // Use the accessibility label as a fallback
            if (!label) {
                label = elem.attr('aria-label');
            }
            
            let newControl:IInvalidControl = {
                label: label,
                element: controlElement,
            };

            controls.push(newControl);

            return controls;

        }, []);

    }

    /**
     * Scroll the user to the problem control element
     * @param control
     */
    public scrollToControl(control:IInvalidControl) {


        //try to find any parent tab frame(s) that are not selected
        let parentInactiveTabs = $(control.element).parents('md-tab-content:not(.md-active)');

        if (parentInactiveTabs.length > 0) {
            //if found, defer navigation until digest cycle is completed
            this.$timeout(() => {

                //iterate over all inactive parent tabs
                _.each(parentInactiveTabs, (parentInactiveTab) => {
                    //find the index offset
                    let index:number = $(parentInactiveTab).index();
                    //find and initiate click event on the target tab
                    let targetTab = $(parentInactiveTab).closest('md-tabs').find('md-tab-item').eq(index);
                    targetTab.click();
                });

            });
        }

        this.touchFormInvalid(this.formReference);

        //scroll to the problematic control element
        $('html,body').animate({scrollTop: $(control.element).offset().top - 20}, "slow");
        this.$timeout(() => {
            $(control.element).focus();
        }, 100);
    }

    /**
     * Touch all the invalid controls in a form. If the control is a sub-form recurse down into that touching
     * all invalid controls
     * @param form
     */
    private touchFormInvalid(form:ng.IFormController) {

        _.forIn(form.$error, (formControls:(ng.INgModelController|ng.IFormController)[], errorKey:string) => {

            _.forEach(formControls, (formControl:ng.INgModelController|ng.IFormController) => {

                if (_.has(formControl, '$modelValue')) {
                    (<ng.INgModelController>formControl).$setTouched();
                } else {
                    this.touchFormInvalid(<ng.IFormController>formControl);
                }

            });

        });

    }

}

class CommandWidgetDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['commandWidget'];
    public template = require('./commandWidget.tpl.html');
    public replace = true;
    public scope = {
        saveAction: '&',
        saveDisabled: '=?',
        deleteAction: '&',
        deleteDisabled: '=?',
        cancelAction: '&?',
        cancelDisabled: '=?',
        formReference: '=?',
    };

    constructor(private $timeout:ng.ITimeoutService) {
    }

    public controllerAs = 'CommandWidgetController';
    public controller = CommandWidgetController;
    public bindToController = true;

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[CommandWidgetController]) => {

        let commandWidgetController = $controllers[0];

        commandWidgetController.hasDelete = _.has($attrs, 'deleteAction');
        commandWidgetController.hasSave = _.has($attrs, 'saveAction');
        commandWidgetController.hasCancel = _.has($attrs, 'cancelAction');

    };

    static factory():ng.IDirectiveFactory {
        let directive = ($timeout) => new CommandWidgetDirective($timeout);
        directive.$inject = ['$timeout'];
        return directive;
    }
}

angular.module(namespace, [
        'drop-ng', //popovers - https://github.com/stevenh77/drop-ng
])
    .directive('commandWidget', CommandWidgetDirective.factory())
;

