import * as angular from "angular";
import * as _ from "lodash";
import ProgramOption from "../../models/programOption/programOptionModel";
import {
    IProgramOptionType,
    default as ProgramOptionService,
    IProgramOptionSelected
} from "../../services/program/programOption/programOptionService";

export const namespace = 'common.directives.programOptions';

export interface IProgramOptionsChangedHandler {
    (programOptions:ProgramOption[]):void;
}

export class ProgramOptionsController {

    static $inject = ['programOptionService'];

    private programOptionsChangedHandler:IProgramOptionsChangedHandler;

    public programOptions:ProgramOption[];
    public allProgramOptions:ProgramOption[];

    public sortedProgramOptions:IProgramOptionType[];

    constructor(private programOptionService:ProgramOptionService) {
    }

    public registerProgramOptionsChangedHandler(handler:IProgramOptionsChangedHandler):void {
        this.programOptionsChangedHandler = handler;
    }

    public sortProgramOptions():void {
        this.sortedProgramOptions = this.programOptionService.initializeProgramOptions(this.allProgramOptions, this.programOptions, false, false);
    }

    public programOptionSelected(programOption:IProgramOptionSelected):void {
        if (programOption.selected) { // Add
            this.programOptions.push(programOption.programOption);
        } else { // Remove
            this.programOptions = _.reject(this.programOptions, (option:ProgramOption) => {
                return option.programOptionId == programOption.programOption.programOptionId;
            });
        }

        this.programOptionsChangedHandler(this.programOptions);
    }

}

class ProgramOptionsDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'programOptions'];
    public template = require('./programOptions.tpl.html');
    public replace = true;
    public scope = {
        allProgramOptions: '='
    };

    public controllerAs = 'ProgramOptionsController';
    public controller = ProgramOptionsController;
    public bindToController = true;

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, ProgramOptionsController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerProgramOptionsChangedHandler((programOptions:ProgramOption[]) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(angular.copy(programOptions));
        });

        if ($ngModelController) {
            $ngModelController.$render = () => {
                directiveController.programOptions = $ngModelController.$modelValue;
                directiveController.sortProgramOptions();
            };

            (<any>$ngModelController.$validators).oneOfEachType = (modelValue:ProgramOption[], viewValue:ProgramOption[]):boolean => {

                let optionsSelected = modelValue || viewValue;

                if (_.isEmpty(optionsSelected) || _.isEmpty(directiveController.sortedProgramOptions)) {
                    return false;
                }

                return _.every(directiveController.sortedProgramOptions, (optionType:IProgramOptionType) => {

                    return _.some(optionType.programOptions, (option:IProgramOptionSelected) => {

                        return _.some(optionsSelected, {programOptionId: option.programOption.getKey()});
                    });
                });
            }

        }
    };

    static factory():ng.IDirectiveFactory {
        return () => new ProgramOptionsDirective();
    }
}

angular.module(namespace, [])
    .directive('programOptions', ProgramOptionsDirective.factory())
;

