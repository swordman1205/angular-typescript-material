import {expect} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import {ScheduleDialogController, namespace} from "./scheduleDialog";
import ProgramOptionTypeMock from "../../../models/programOptionType/programOptionTypeModel.mock";
import ProgramOptionMock from "../../../models/programOption/programOptionModel.mock";
import CycleScheduleItemMock from "../../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import ProgramMock from "../../../models/program/programModel.mock";
import CycleMock from "../../../models/cycle/cycleModel.mock";
import ScheduleService, {ISchedule, IFeedFormatOption} from "../../../services/program/schedule/scheduleService";
import NotificationService from "../../../services/notification/notificationService";
import RegionService from "../../../services/region/regionService";
import CycleService from "../../../services/program/cycle/cycleService";
import ProgramOptionService, {IProgramOptionType} from "../../../services/program/programOption/programOptionService";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";
import Country from "../../../models/country/countryModel";
import CountryMock from "../../../models/country/countryModel.mock";
import TimezoneMock from "../../../models/timezone/timezoneModel.mock";
import Timezone from "../../../models/timezone/timezoneModel";

describe('Scheduled Item Directive - Schedule Dialog', () => {

    let ScheduleDialogController:ScheduleDialogController,
        $rootScope:ng.IRootScopeService,
        $mdDialog:ng.material.IDialogService,
        scheduleService:ScheduleService,
        notificationService:NotificationService,
        regionService:RegionService,
        cycleService:CycleService,
        $q:ng.IQService,
        $mdpTimePicker,
        programOptionService:ProgramOptionService;

    // Mocks
    let today = moment.utc(),
        optionTypes = ProgramOptionTypeMock.collection(2),
        programOptions = ProgramOptionMock.collection(4, {
            programOptionTypeId: optionTypes[0].programOptionTypeId,
            _programOptionType: optionTypes[0]
        }).concat(ProgramOptionMock.collection(4, {
            programOptionTypeId: optionTypes[1].programOptionTypeId,
            _programOptionType: optionTypes[1]
        })),
        scheduledItem = CycleScheduleItemMock.entity({
            scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
            scheduleTime: moment.duration('12:00:00'),
            scheduleDate: today.clone(),
            _options: [programOptions[1], programOptions[4], programOptions[5]]
        }),
        program = ProgramMock.entity({
            periodCount: 5,
            periodLength: 7
        }),
        cycle = CycleMock.entity({
            periodOneStartDate: today.clone(),
            periodInfo: [],
            postSeasonDays: 5,
            scheduleOnSaleStart: today.clone(),
            scheduleOnSalePreSaleDays: 7
        }),
        schedule:ISchedule,
        mdDialogOptions:ng.material.IDialogOptions,
        cycleOptionTypes:IProgramOptionType[],
        timezone = TimezoneMock.entity({
            displayOffset: '+11:00',
            isDst: true,
            offset: 39600,
            timezoneIdentifier: 'Australia/Sydney'
        }),
        countries:Country[] = [
            CountryMock.entity({
                countryName: 'Australia',
                countryCode: 'AU',
            })
        ],
        selectedCountry:Country = countries[0];

    countries[0].timezones.push(timezone);
    let selectedTimezone:Timezone = countries[0].timezones[0];

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject(($controller, _$rootScope_, _$mdDialog_, _scheduleService_, _notificationService_, _$q_, _regionService_, _cycleService_, _programOptionService_) => {
            $rootScope = _$rootScope_;
            $mdDialog = _$mdDialog_;
            scheduleService = _scheduleService_;
            notificationService = _notificationService_;
            $q = _$q_;
            regionService = _regionService_;
            cycleService = _cycleService_;
            programOptionService = _programOptionService_;

            schedule = scheduleService.getSchedule(program, cycle);

            scheduleService.setScheduleItemDate(schedule, scheduledItem);

            cycleOptionTypes = programOptionService.initializeProgramOptions(programOptions, scheduledItem._options);

            mdDialogOptions = {
                template: require('./scheduleDialog.tpl.html'),
                controller: namespace + '.controller',
                controllerAs: 'ScheduleDialogController',
                locals: {
                    scheduledItem: scheduledItem,
                    schedule: schedule,
                    program: program,
                    cycleOptionTypes: cycleOptionTypes,
                    selectedCountry: selectedCountry,
                    countries: countries,
                    selectedTimezone: selectedTimezone,
                    displayDateTime: null
                }
            };

            $mdpTimePicker = sinon.stub().returns($q.when('2016-01-01 02:00:00'));

            ScheduleDialogController = $controller(namespace + '.controller', {
                scheduledItem: scheduledItem,
                schedule: schedule,
                program: program,
                cycleOptionTypes: cycleOptionTypes,
                selectedCountry: selectedCountry,
                countries: countries,
                selectedTimezone: selectedTimezone,
                mdDialogOptions: mdDialogOptions,
                $mdDialog: $mdDialog,
                $mdpTimePicker: $mdpTimePicker,
                scheduleService: scheduleService,
                regionService: regionService,
                displayDateTime: null,
                notificationService: notificationService,
                cycleService: cycleService
            });
        });

    });

    describe('Initialization', () => {

        it('should initialize correctly (scheduled item)', () => {

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypePeriod,
                scheduleTime: moment.duration('12:00:00'),
                scheduledRelativeToPeriodDays: -2,
                __scheduleDateTime: today.clone()
            });

            (<any>ScheduleDialogController).displayDateTime = null;

            (<any>ScheduleDialogController).initialize();

            expect(ScheduleDialogController.afterPeriodBegins).to.be.false;

            expect(ScheduleDialogController.daysRelative).to.equal(2);

            expect(moment.utc(ScheduleDialogController.displayDateTime).format('YYYY/MM/DD HH:mm:ss')).to.equal(today.clone().format('YYYY/MM/DD HH:mm:ss'));

        });

        it('should initialize correctly (unscheduled item)', () => {

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: null
            });

            (<any>ScheduleDialogController).displayDateTime = null;

            (<any>ScheduleDialogController).initialize();

            expect(ScheduleDialogController.afterPeriodBegins).to.be.true;

            expect(ScheduleDialogController.daysRelative).to.equal(0);

            expect(ScheduleDialogController.displayDateTime).to.not.be.null;

            expect(ScheduleDialogController.scheduledItem.scheduledRelativeTo).to.equal(CycleScheduleItem.scheduledRelativeToTypePeriod);
            expect(ScheduleDialogController.scheduledItem.periodIndex).to.equal(0);
            expect(ScheduleDialogController.scheduledItem.scheduledRelativeToPeriodDays).to.equal(0);

        });

    });

    it('should be able to close the dialog', () => {

        $mdDialog.cancel = sinon.stub();

        ScheduleDialogController.cancelDialog();

        expect($mdDialog.cancel).to.be.called;

    });

    it('should be able to set date offset to zero', () => {

        ScheduleDialogController.displayDateTime = today.clone().utcOffset(200);

        ScheduleDialogController.setDateOffsetToZero();

        expect(ScheduleDialogController.displayDateTime).to.deep.equal(moment.utc(today.clone().utcOffset(200).format('YYYY-MM-DD HH:mm:ss')));

    });

    describe('Save', () => {

        beforeEach(() => {

            scheduleService.save = sinon.stub().returns($q.when(true));
            $mdDialog.hide = sinon.stub();
            notificationService.toast = sinon.stub().returns({pop: sinon.stub()});
            scheduleService.assignScheduleItemToPeriod = sinon.stub();

        });

        it('should be able to save changes (Period: Add Days)', () => {

            ScheduleDialogController.displayDateTime = today.clone();
            ScheduleDialogController.daysRelative = 2;
            ScheduleDialogController.afterPeriodBegins = true;

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypePeriod,
                periodIndex: 0
            });

            ScheduleDialogController.save();

            expect(ScheduleDialogController.scheduledItem.scheduleTime.format()).to.deep.equal(today.format('HH:mm:ss'));

            expect(ScheduleDialogController.scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.equal(today.clone().add(2, 'days').format('YYYY-MM-DD HH:mm:ss'));

            expect(scheduleService.save).to.be.calledWith(ScheduleDialogController.scheduledItem);

            $rootScope.$apply();

            expect(notificationService.toast).to.be.calledWith('Item scheduled successfully');

            expect(scheduleService.assignScheduleItemToPeriod).to.be.calledWith(schedule, ScheduleDialogController.scheduledItem);

            expect($mdDialog.hide).to.be.called;

        });

        it('should be able to save changes (Period: Add Days)', () => {

            ScheduleDialogController.displayDateTime = today.clone();
            ScheduleDialogController.daysRelative = 1;
            ScheduleDialogController.afterPeriodBegins = false;

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypePeriod,
                periodIndex: 0
            });

            ScheduleDialogController.save();

            expect(ScheduleDialogController.scheduledItem.scheduleTime.format()).to.deep.equal(today.format('HH:mm:ss'));

            expect(ScheduleDialogController.scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.equal(today.clone().subtract(1, 'days').format('YYYY-MM-DD HH:mm:ss'));

        });

        it('should be able to save changes (Timezone)', () => {

            ScheduleDialogController.displayDateTime = today.clone();

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
            });

            ScheduleDialogController.save();

            expect(ScheduleDialogController.scheduledItem.scheduleDate.format('YYYY-MM-DD')).to.deep.equal(today.format('YYYY-MM-DD'));

            expect(ScheduleDialogController.scheduledItem.scheduleTime.format()).to.deep.equal(today.format('HH:mm:ss'));

            expect(ScheduleDialogController.scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.equal(today.clone().format('YYYY-MM-DD HH:mm:ss'));

        });

        it('should be able to save changes (Global)', () => {

            let dateTime = moment('2016-01-02 01:00:00');

            ScheduleDialogController.displayDateTime = dateTime.clone();
            ScheduleDialogController.selectedTimezone.offset = 7200; // Offset in seconds

            ScheduleDialogController.scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeGlobal,
            });

            ScheduleDialogController.save();

            expect(ScheduleDialogController.scheduledItem.scheduleDate.format('YYYY-MM-DD')).to.deep.equal('2016-01-01');

            expect(ScheduleDialogController.scheduledItem.scheduleTime.format()).to.deep.equal('23:00:00');

            expect(ScheduleDialogController.scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.equal('2016-01-01 23:00:00');

        });

    });

    it('should be able to show the time picker', () => {

        $mdDialog.show = sinon.stub();

        ScheduleDialogController.displayDateTime = today.clone();

        ScheduleDialogController.showTimePicker(null);

        expect($mdpTimePicker).to.be.calledWith(null, new Date(today.format('YYYY/MM/DD HH:mm:ss')));

        $rootScope.$apply();

        expect(ScheduleDialogController.displayDateTime.format('HH:mm:ss')).to.equal('02:00:00');

        expect((<any>ScheduleDialogController).mdDialogOptions.locals['displayDateTime'].format('YYYY-MM-DD HH:mm:ss')).to.equal(ScheduleDialogController.displayDateTime.format('YYYY-MM-DD HH:mm:ss'));

        expect($mdDialog.show).to.be.calledWith((<any>ScheduleDialogController).mdDialogOptions);

    });

    it('should be able to update option types', () => {

        notificationService.toast = sinon.stub().returns({options: sinon.stub().returns({pop: sinon.stub()})});

        // Validation Fail
        ScheduleDialogController.optionTypeSelected(ScheduleDialogController.cycleOptionTypes[0].programOptions[1]);

        expect(notificationService.toast).to.be.called;

        // Remove
        ScheduleDialogController.optionTypeSelected(ScheduleDialogController.cycleOptionTypes[1].programOptions[0]);

        expect(scheduledItem._options.length).to.equal(2);

        expect(ScheduleDialogController.cycleOptionTypes[1].programOptions[0].selected).to.be.false;

        // Add
        ScheduleDialogController.optionTypeSelected(ScheduleDialogController.cycleOptionTypes[1].programOptions[0]);

        expect(scheduledItem._options.length).to.equal(3);

        expect(ScheduleDialogController.cycleOptionTypes[1].programOptions[0].selected).to.be.true;

    });

});

