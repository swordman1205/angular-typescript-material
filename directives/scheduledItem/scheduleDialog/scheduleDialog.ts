import * as angular from "angular";
import * as _ from "lodash";
import Program from "../../../models/program/programModel";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import momentDate from "../../../libs/moment/momentDate";
import {ISchedule, default as ScheduleService} from "../../../services/program/schedule/scheduleService";
import NotificationService from "../../../services/notification/notificationService";
import RegionService from "../../../services/region/regionService";
import CycleService from "../../../services/program/cycle/cycleService";
import {IProgramOptionType, IProgramOptionSelected} from "../../../services/program/programOption/programOptionService";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";
import Timezone from "../../../models/timezone/timezoneModel";
import Country from "../../../models/country/countryModel";
import {TOAST_COLOUR_RED} from "../../../services/notification/notificationService.ts";

export const namespace = 'common.directives.scheduledItem.scheduleDialog';

export class ScheduleDialogController {

    public afterPeriodBegins:boolean = true;
    public daysRelative:number = 0;

    static $inject = ['scheduledItem', 'schedule', 'program', 'cycleOptionTypes', 'selectedCountry', 'countries', 'selectedTimezone', 'mdDialogOptions', '$mdDialog', '$mdpTimePicker', 'scheduleService', 'regionService', 'displayDateTime', 'notificationService', 'cycleService'];

    constructor(public scheduledItem:CycleScheduleItem,
                public schedule:ISchedule,
                public program:Program,
                public cycleOptionTypes:IProgramOptionType[],
                public selectedCountry:Country,
                public countries:Country[] = [],
                public selectedTimezone:Timezone,
                private mdDialogOptions:ng.material.IDialogOptions,
                private $mdDialog:ng.material.IDialogService,
                private $mdpTimePicker,
                private scheduleService:ScheduleService,
                private regionService:RegionService,
                public displayDateTime:moment.Moment,
                private notificationService:NotificationService,
                private cycleService:CycleService) {
        this.initialize();
    }

    private initialize():void {

        if (!this.scheduledItem.scheduledRelativeTo) { // Unscheduled item, set defaults
            this.scheduledItem.scheduledRelativeTo = CycleScheduleItem.scheduledRelativeToTypePeriod;
            this.scheduledItem.periodIndex = 0;
            this.scheduledItem.scheduledRelativeToPeriodDays = 0;
            this.displayDateTime = moment();
        } else if (_.isNull(this.displayDateTime) && !_.isNull(this.scheduledItem.__scheduleDateTime)) { // displayDateTime is null on first open
            this.displayDateTime = this.scheduledItem.__scheduleDateTime.clone();

            // For the 'scheduled for a specific type (global)' type
            // the time displayed should reflect the current timezone that is showing
            if (this.scheduledItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypeGlobal) {
                this.changeTimeWithTimezone(this.selectedTimezone);
            }
        }

        if (_.isNumber(this.scheduledItem.scheduledRelativeToPeriodDays)) {
            if (this.scheduledItem.scheduledRelativeToPeriodDays < 0) {
                this.afterPeriodBegins = false;
            }

            this.daysRelative = Math.abs(this.scheduledItem.scheduledRelativeToPeriodDays);
        }

        // We always want a time showing and prevent undefined displayDateTime issues
        this.displayDateTime = (this.displayDateTime) ? this.displayDateTime : moment();
    }

    /**
     * Close this dialog.
     */
    public cancelDialog():void {

        this.$mdDialog.cancel();

    }

    /**
     * This function is called when global date picker is used. The date picker returns a
     * date at local time, we need to set it to a date at UTC 0.
     */
    public setDateOffsetToZero():void {

        this.displayDateTime = moment.utc(this.displayDateTime.format('YYYY-MM-DD HH:mm:ss'));

    }

    /**
     * This function is called when timezone is changed and we are showing the equivalent local time.
     */
    public changeTimeWithTimezone(timezone:Timezone):void {
        if (timezone.offset != 0) {
            this.displayDateTime.utcOffset(this.displayDateTime.utcOffset() + (timezone.offset / 60));
        }
    }

    /**
     * Save changes made to schedule.
     */
    public save() {

        if (this.scheduledItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypePeriod) {
            if (this.afterPeriodBegins) {
                this.scheduledItem.scheduledRelativeToPeriodDays = this.daysRelative;
            }
            else {
                this.scheduledItem.scheduledRelativeToPeriodDays = this.daysRelative * -1;
            }
        }
        else if (this.scheduledItem.scheduledRelativeTo == CycleScheduleItem.scheduledRelativeToTypeGlobal) {
            if (this.selectedTimezone.offset != 0) {
                // At this point the offset should be 0, to counter the offset we have
                // to subtract the offset of our selected timezone.
                this.displayDateTime.utcOffset(this.displayDateTime.utcOffset() - (this.selectedTimezone.offset / 60));
            }
        }

        // We should always save the time. We don't need the date if it's scheduled according
        // to period, scheduleService.save has a cleanup function which will nullify unneeded parameters.
        this.scheduledItem.scheduleDate = momentDate(this.displayDateTime.format('YYYY-MM-DD'));
        this.scheduledItem.scheduleTime = moment.duration(this.displayDateTime.format('HH:mm:ss'));

        // Update __scheduleDateTime
        this.scheduleService.setScheduleItemDate(this.schedule, this.scheduledItem);

        this.scheduleService.save(this.scheduledItem)
            .then(() => {
                this.notificationService.toast('Item scheduled successfully').pop();
                this.scheduleService.assignScheduleItemToPeriod(this.schedule, this.scheduledItem);
                this.$mdDialog.hide();
            });

    }

    /**
     * Show the time picker.
     * @param event
     * @returns {IPromise<TResult>}
     */
    public showTimePicker(event):ng.IPromise<any> {

        // $mdpTimePicker expects a Date object for it's second parameter, it uses
        // angular.isDate() to check to see if the object is a Date or not (i.e. can't use
        // a moment object). See line 203:
        // https://github.com/alenaksu/mdPickers/blob/0.5.0/src/components/mdTimePicker/mdTimePicker.js
        return this.$mdpTimePicker(event, new Date(this.displayDateTime.format('YYYY/MM/DD HH:mm:ss')))
            .then((selectedTime:string) => {
                // The response given to us is a string, see line 44 on:
                // https://github.com/alenaksu/mdPickers/blob/0.5.0/src/components/mdTimePicker/mdTimePicker.js
                // The response does not pass back the date we gave it above, it passes
                // back today's date so we need to extract the time.

                let newTime = moment(selectedTime);

                this.displayDateTime.hour(newTime.hour());
                this.displayDateTime.minute(newTime.minute());
                this.displayDateTime.second(0);

                // Need to set this in mdDialogOptions so that the time and timezone changes stick
                // when the scheduleDialog is re-opened.
                this.mdDialogOptions.locals['displayDateTime'] = this.displayDateTime;
                this.mdDialogOptions.locals['selectedCountry'] = this.selectedCountry;
                this.mdDialogOptions.locals['selectedTimezone'] = this.selectedTimezone;

            })
            .finally(() => {
                this.$mdDialog.show(this.mdDialogOptions);
            });
    }

    /**
     * A program option was selected or deselected, add or remove from _options and
     * update 'selected'.
     *
     * @param programOptionSelected
     */
    public optionTypeSelected(programOptionSelected:IProgramOptionSelected) {

        if (!this.scheduleService.validateProgramOptionSelection(programOptionSelected, this.cycleOptionTypes)) {

            this.notificationService.toast('You have to have at least one option selected per category.', TOAST_COLOUR_RED).options({parent: '#scheduleDialog'}).pop();

            return;
        }

        if (programOptionSelected.selected) { // Remove
            this.scheduledItem._options = _.reject(this.scheduledItem._options, (programOption) => {
                return programOption.programOptionId == programOptionSelected.programOption.programOptionId;
            });
        }
        else { // Add
            this.scheduledItem._options.push(programOptionSelected.programOption);
        }

        programOptionSelected.selected = !programOptionSelected.selected;

    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', ScheduleDialogController);

