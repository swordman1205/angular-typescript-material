import * as angular from "angular";
import * as _ from "lodash";
import Localization from "../../models/localization/localizationModel";

export const namespace = 'common.directives.localizableInput';

export interface ILocalizationChangeHandler {
    (localizations:Localization<any>[]):void;
}

export interface IInputElementAttributes extends ng.IAttributes {
    ngModel:string;
    localizableInputPath:string;
}

interface ILocalizableInputScope extends ng.IScope {
    localizableInput:Localization<any>[];
}

export class LocalizableInputController {

    public localizableInput:Localization<any>[];
    public localizationCount:number = 0;
    private changeHandler:ILocalizationChangeHandler;
    private attributeKey:string;
    private inputNodeName:string;
    public $ngModelController:ng.INgModelController;

    static $inject = ['$mdDialog', '$compile'];

    constructor(private $mdDialog:ng.material.IDialogService, private $compile:ng.ICompileService) {
    }

    public registerChangeHandler(handler:ILocalizationChangeHandler) {
        this.changeHandler = handler;
    }

    public getButtonElement($scope:ng.IScope):ng.IAugmentedJQuery {

        return this.$compile(`
            <md-button ng-click="LocalizableInputController.promptAddLocalization($event)" class="md-icon-button localizable-input">
                <md-icon ng-class="{'md-accent' : LocalizableInputController.localizationCount > 0}">public</md-icon>
            </md-button>`)($scope);
    }

    /**
     * Get the attribute name by parsing the ng-model="path.to.attribute" attribute.
     * @param $element
     * @param $attrs
     */
    public setInputAttributes($element:ng.IAugmentedJQuery, $attrs:IInputElementAttributes):void {
        this.inputNodeName = $element.prop('nodeName').toLowerCase();

        if ($attrs.localizableInputPath) {
            this.attributeKey = $attrs.localizableInputPath;
        } else {
            this.attributeKey = _.last($attrs.ngModel.split('.'));
        }
        this.updateLocalizationCount();
    }

    /**
     * Prompt the localisation dialog to pop up
     * @param $event
     * @returns {IPromise<Localization<any>[]>}
     */
    public promptAddLocalization($event:MouseEvent):ng.IPromise<Localization<any>[]> {

        let dialogConfig:ng.material.IDialogOptions = {
            targetEvent: $event,
            template: require('./dialog/localizableInputDialog.tpl.html'),
            controller: namespace + '.dialog.controller',
            controllerAs: 'LocalizableInputDialogController',
            clickOutsideToClose: true,
            locals: {
                localizations: this.localizableInput,
                attributeKey: this.attributeKey,
                inputNodeName: this.inputNodeName,
                originalValue: this.$ngModelController.$modelValue,
            }
        };

        return this.$mdDialog.show(dialogConfig)
            .then((updatedLocalizations:Localization<any>[]) => {

                this.changeHandler(updatedLocalizations);
                this.localizableInput = updatedLocalizations;

                this.updateLocalizationCount();

                return updatedLocalizations;
            });

    }

    private updateLocalizationCount():number {

        this.localizationCount = _.reject(this.localizableInput, (localization:Localization<any>) => {
            return _.isEmpty(_.get<string>(localization.localizations, this.attributeKey));
        }).length;

        return this.localizationCount;
    }

}

class LocalizableInputDirective implements ng.IDirective {

    public restrict = 'A';
    public require = ['ngModel', 'localizableInput'];
    public replace = false;
    public scope = {
        localizableInput: '='
    };

    public controllerAs = 'LocalizableInputController';
    public controller = LocalizableInputController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ILocalizableInputScope, $element:ng.IAugmentedJQuery, $attrs:IInputElementAttributes, $controllers:[ng.INgModelController, LocalizableInputController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.setInputAttributes($element, $attrs);

        $element.after(directiveController.getButtonElement($scope));

        let parent = $element.parent('md-input-container');
        if (parent.length) {
            parent.addClass('localizable');
        }

        directiveController.registerChangeHandler((localizations:Localization<any>[]) => {
            $ngModelController.$setDirty();
        });

        directiveController.$ngModelController = $ngModelController;

    };

    static factory():ng.IDirectiveFactory {
        return () => new LocalizableInputDirective();
    }
}

import {namespace as dialog} from "./dialog/localizableInputDialog";

angular.module(namespace, [
        dialog,
    ])
    .directive('localizableInput', LocalizableInputDirective.factory())
;

