import * as angular from "angular";
import * as _ from "lodash";
import User from "../../models/user/userModel";
import CountriesService from "../../services/countries/countriesService";
import State from "../../models/state/stateModel";
import INgModelController = angular.INgModelController;
import Country from "../../models/country/countryModel";

export const namespace = 'common.directives.userCountrySelect';

export interface ICountryChangedHandler {
    (user:User):void;
}

export class UserCountrySelectController {

    public countries:Country[];
    public states:State[] = [];
    public form:ng.IFormController;
    public directiveForm:ng.IFormController;

    static $inject = ['countriesService'];

    private countryChangedHandler:ICountryChangedHandler;

    public user:User;

    constructor(private countriesService:CountriesService
    ) {
        countriesService.getAllCountries()
            .then((countries:Country[]) => {
                this.countries = countries;
            });
    }

    public registerCountryChangedHandler(handler:ICountryChangedHandler):void {
        this.countryChangedHandler = handler;
    }

    public countryChanged():void {

        this.userChanged();

        if(this.countriesService.countryHasStates(this.user.country)) {
            this.countriesService.getCountryStates(this.user.country)
                .then((states:State[]) => {
                    this.states = states;
                });
        }
        else {
            this.states = [];
        }
    }

    public userChanged():void {

        this.countryChangedHandler(this.user);

    }

    public registerControls():void {

        if (this.form) {
            angular.forEach(this.directiveForm, (object:Object) => {
                if (typeof object === 'object' && object.hasOwnProperty('$modelValue')) { // NgModelController
                    // Add controls to parent form
                    this.form.$addControl(<INgModelController>object);
                }
            });
        }
    }

}

class UserCountrySelectDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'userCountrySelect'];
    public template = require('./userCountrySelect.tpl.html');
    public replace = true;
    public scope = {
        form: '=' // Bind parent form if you want country/state controls to be added to it
    };

    public controllerAs = 'UserCountrySelectController';
    public controller = UserCountrySelectController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, UserCountrySelectController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerCountryChangedHandler((user:User) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(user);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                directiveController.user = $ngModelController.$modelValue;
                directiveController.registerControls();
                directiveController.countryChanged();

            };

        }

    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new UserCountrySelectDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('userCountrySelect', UserCountrySelectDirective.factory());

