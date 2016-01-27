import * as angular from "angular";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import {AbstractModel} from "../../models/abstractModel";
import CountriesService from "../../services/countries/countriesService";
import Timezone from "../../models/timezone/timezoneModel";
import Country from "../../models/country/countryModel";

export interface ISchedulableModel extends AbstractModel {
    published:moment.Moment;
}

export interface IEntityChangedHandler<M extends ISchedulableModel> {
    (entity:M):void;
}

export const namespace = 'common.directives.scheduleToolbar';

export class ScheduleToolbarController<M extends ISchedulableModel> {

    static $inject = ['$mdpTimePicker', 'countriesService'];

    private entityChangedHandler:IEntityChangedHandler<M>;

    public toggleSchedule:Function;
    public entity:M;
    public publishedDate:Date;
    public selectedTimezone:Timezone;
    public countries:Country[] = [];
    public selectedCountry:Country;

    constructor(private $mdpTimePicker,
                public countriesService:CountriesService) {

        this.countriesService.getAllCountries()
            .then((countries:Country[]) => {
                    this.countries = countries;
                }
            )
        ;

        this.countriesService.getUsersCountry()
            .then((country:Country) => {
                this.selectedCountry = country;
            });

        this.countriesService.getUsersTimezone()
            .then((timezone:Timezone) => {
                this.selectedTimezone = timezone;
            });
    }

    public registerEntityChangedHandler(handler:IEntityChangedHandler<M>):void {
        this.entityChangedHandler = handler;
    }

    /**
     * Show the time picker.
     * @param event
     * @returns {IPromise<TResult>}
     */
    public showTimePicker(event):ng.IPromise < any > {

        // $mdpTimePicker expects a Date object for it's second parameter, it uses
        // angular.isDate() to check to see if the object is a Date or not (i.e. can't use
        // a moment object). See line 203:
        // https://github.com/alenaksu/mdPickers/blob/0.5.0/src/components/mdTimePicker/mdTimePicker.js

        return this.$mdpTimePicker(event, new Date(this.entity.published.format('YYYY/MM/DD HH:mm:ss')))
            .then((selectedTime:string) => {
                // The response given to us is a string, see line 44 on:
                // https://github.com/alenaksu/mdPickers/blob/0.5.0/src/components/mdTimePicker/mdTimePicker.js
                // The response does not pass back the date we gave it above, it passes
                // back today's date so we need to extract the time.

                let newTime = moment(selectedTime);

                this.entity.published.hour(newTime.hour());
                this.entity.published.minute(newTime.minute());
                this.entity.published.second(newTime.second());
            });
    }

    public closeToolbar():void {

        //assign the md-datepicker Date object back to the moment published object
        let dateComponents = {
            year: this.publishedDate.getFullYear(),
            month: this.publishedDate.getMonth(),
            date: this.publishedDate.getDate(),
        };

        this.entity.published.set(dateComponents);

        // Adjust the time according to the set timezone
        if (this.selectedTimezone) {
            this.entity.published.add((this.entity.published.utcOffset() * 60) - this.selectedTimezone.offset, 'second');
        }
        this.entityChangedHandler(this.entity);

        this.toggleSchedule();
    }
}

class ScheduleToolbarDirective<M extends ISchedulableModel> implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'scheduleToolbar'];
    public template = require('./scheduleToolbar.tpl.html');
    public replace = true;
    public scope = {
        toggleSchedule: '&' // Function used to toggle this toolbar
    };

    public controllerAs = 'ScheduleToolbarController';
    public controller = ScheduleToolbarController;
    public bindToController = true;

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, ScheduleToolbarController<M>]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        // When the model is updated via the directive, the view value will also update,
        // however the form will not be set dirty/touched.
        directiveController.registerEntityChangedHandler((entity:M) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(entity);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                let modelValue = $ngModelController.$modelValue;
                directiveController.entity = modelValue;

                if (modelValue.published instanceof moment){
                    directiveController.publishedDate = modelValue.published.clone().toDate();
                } else {
                    modelValue.published = moment();
                    directiveController.publishedDate = modelValue.published.clone().toDate();
                }
            };

        }

    };

    static factory():ng.IDirectiveFactory {
        return () => new ScheduleToolbarDirective();
    }
}

angular.module(namespace, [])
    .directive('scheduleToolbar', ScheduleToolbarDirective.factory());

