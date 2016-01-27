import * as angular from "angular";
import Program from "../../models/program/programModel";
import CycleScheduleItem from "../../models/cycleScheduleItem/cycleScheduleItemModel";
import ProgramPost from "../../models/post/programPost/programPostModel";
import Guide from "../../models/post/guide/guideModel";
import ProgramOption from "../../models/programOption/programOptionModel";
import Cycle from "../../models/cycle/cycleModel";
import {ISchedule, default as ScheduleService} from "../../services/program/schedule/scheduleService";
import {
    IProgramOptionType,
    default as ProgramOptionService
} from "../../services/program/programOption/programOptionService";
import CountriesService from "../../services/countries/countriesService";
import NotificationService from "../../services/notification/notificationService";
import {namespace as adminProgramPostNamespace} from "../../../app/admin/programs/program/cycle/schedule/programPost/programPost";
import {namespace as adminProgramGuideNamespace} from "../../../app/admin/guides/guide/guide";
import {namespace as copyToDialogNamespace} from "./copyToDialog/copyToDialog";
import {namespace as feedFormattingDialogNamespace} from "./feedFormattingDialog/feedFormattingDialog";
import {namespace as scheduleDialogNamespace} from "./scheduleDialog/scheduleDialog";
import Timezone from "../../models/timezone/timezoneModel";
import Country from "../../models/country/countryModel";

export const namespace = 'common.directives.scheduledItem';

export interface IScheduledItemChangedHandler {
    (scheduledItem:Guide|ProgramPost):void;
}

export class ScheduledItemController {

    static $inject = ['programOptionService', 'countriesService', '$state', '$mdDialog', 'scheduleService', 'notificationService'];

    private scheduledItemChangedHandler:IScheduledItemChangedHandler;

    public scheduledItem:CycleScheduleItem;

    public schedule:ISchedule;

    public program:Program;

    public programOptions:ProgramOption[];

    public cycleOptionTypes:IProgramOptionType[] = [];

    public cycle:Cycle;

    public selectedTimezone:Timezone;
    public countries:Country[] = [];
    public selectedCountry:Country;

    constructor(private programOptionService:ProgramOptionService,
                private countriesService:CountriesService,
                private $state:ng.ui.IStateService,
                private $mdDialog:ng.material.IDialogService,
                private scheduleService:ScheduleService,
                private notificationService:NotificationService) {
        this.countriesService.getAllCountries()
            .then((countries:Country[]) => {
                this.countries = countries;
            });

        this.countriesService.getUsersCountry()
            .then((country:Country) => {
                this.selectedCountry = country;
            });

        this.countriesService.getUsersTimezone()
            .then((timezone:Timezone) => {
                this.selectedTimezone = timezone;
            });
    }

    /**
     * Create cycleOptionTypes from programOptions and scheduledItem. This is called in ScheduledItemDirective
     * controller after ngModel has been bound to scheduledItem.
     */
    public initCycleOptionTypes():void {
        this.cycleOptionTypes = this.programOptionService.initializeProgramOptions(this.programOptions, this.scheduledItem._options);
    }

    public registerScheduledItemChangedHandler(handler:IScheduledItemChangedHandler):void {
        this.scheduledItemChangedHandler = handler;
    }

    public editPost():ng.IPromise<any> {

        let targetState:string = '';
        if (this.isProgramPost()) {
            targetState = adminProgramPostNamespace;
        } else {
            targetState = adminProgramGuideNamespace;
        }

        return this.$state.go(targetState, {id: this.scheduledItem._scheduledItem.getKey()});

    }

    /**
     * Checks if the scheduled item is a Program. Otherwise we can assume it would be a guide
     * @returns {boolean}
     */
    public isProgramPost():boolean {
        return this.scheduledItem._scheduledItem instanceof ProgramPost;
    }

    public scheduleItem():ng.IPromise<any> {
        let mdDialogOptions:ng.material.IDialogOptions = {
            template: require('./scheduleDialog/scheduleDialog.tpl.html'),
            controller: scheduleDialogNamespace + '.controller',
            controllerAs: 'ScheduleDialogController',
            locals: {
                scheduledItem: this.scheduledItem,
                schedule: this.schedule,
                program: this.program,
                cycleOptionTypes: this.cycleOptionTypes,
                selectedCountry: this.selectedCountry,
                countries: this.countries,
                selectedTimezone: this.selectedTimezone,
                displayDateTime: null
            }
        };

        // Passing dialog options to the dialog so that we can re-open it after the time
        // picker dialog has been opened and closed. Material does not support
        // more than one dialog open at a time for now:
        // https://github.com/angular/material/issues/698
        mdDialogOptions.locals['mdDialogOptions'] = mdDialogOptions;

        return this.$mdDialog.show(mdDialogOptions);

    }

    public feedFormatting():ng.IPromise<any> {

        let mdDialogOptions:ng.material.IDialogOptions = {
            template: require('./feedFormattingDialog/feedFormattingDialog.tpl.html'),
            controller: feedFormattingDialogNamespace + '.controller',
            controllerAs: 'FeedFormattingDialogController',
            locals: {
                scheduledItem: this.scheduledItem
            }
        };

        return this.$mdDialog.show(mdDialogOptions);

    }

    public copyTo():ng.IPromise<any> {

        let mdDialogOptions:ng.material.IDialogOptions = {
            template: require('./copyToDialog/copyToDialog.tpl.html'),
            controller: copyToDialogNamespace + '.controller',
            controllerAs: 'CopyToDialogController',
            locals: {
                program: this.program,
                scheduledItem: this.scheduledItem,
                schedule: this.schedule,
                cycle: this.cycle
            }
        };

        return this.$mdDialog.show(mdDialogOptions);

    }

    public unschedule():void {

        let confirm = this.$mdDialog.confirm()
            .title("Are you sure you want to unschedule this item?")
            .htmlContent("The item will be moved to the unscheduled section.")
            .ariaLabel("Confirm unschedule")
            .ok("Unschedule")
            .cancel("Cancel");

        this.$mdDialog.show(confirm)
            .then(() => {
                this.scheduledItem.scheduledRelativeTo = null;

                this.scheduleService.save(this.scheduledItem)
                    .then(() => {
                        this.notificationService.toast('Item unscheduled successfully').pop();
                        this.scheduleService.assignScheduleItemToPeriod(this.schedule, this.scheduledItem);
                    });

                this.$mdDialog.hide();
            });

    }
}

class ScheduledItemDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'scheduledItem'];
    public template = require('./scheduledItem.tpl.html');
    public replace = true;
    public scope = {
        schedule: '=',
        program: '=',
        cycle: '=',
        programOptions: '='
    };

    public controllerAs = 'ScheduledItemController';
    public controller = ScheduledItemController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, ScheduledItemController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerScheduledItemChangedHandler((scheduledItem:Guide|ProgramPost) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(scheduledItem);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                if ($ngModelController.$modelValue) {
                    directiveController.scheduledItem = $ngModelController.$modelValue;
                    directiveController.initCycleOptionTypes();
                }

            };

        }
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new ScheduledItemDirective();
        return directive;
    }
}

angular.module(namespace, [
        namespace + '.scheduleDialog',
        namespace + '.feedFormattingDialog',
        namespace + '.copyToDialog'
    ])
    .directive('scheduledItem', ScheduledItemDirective.factory());

