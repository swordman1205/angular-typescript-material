import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {ScheduledItemController} from "./scheduledItem";
import ProgramOption from "../../models/programOption/programOptionModel";
import Cycle from "../../models/cycle/cycleModel";
import Program from "../../models/program/programModel";
import CycleScheduleItem from "../../models/cycleScheduleItem/cycleScheduleItemModel";
import momentDate from "../../libs/moment/momentDate";
import ProgramOptionTypeMock from "../../models/programOptionType/programOptionTypeModel.mock";
import ProgramOptionMock from "../../models/programOption/programOptionModel.mock";
import CycleScheduleItemMock from "../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import ProgramMock from "../../models/program/programModel.mock";
import CycleMock from "../../models/cycle/cycleModel.mock";
import ProgramPostMock from "../../models/post/programPost/programPostModel.mock";
import GuideMock from "../../models/post/guide/guideModel.mock";
import {ISchedule, default as ScheduleService} from "../../services/program/schedule/scheduleService";
import ProgramOptionService from "../../services/program/programOption/programOptionService";
import CountriesService from "../../services/countries/countriesService";
import NotificationService from "../../services/notification/notificationService";
import Country from "../../models/country/countryModel";
import CountryMock from "../../models/country/countryModel.mock";
import TimezoneMock from "../../models/timezone/timezoneModel.mock";

interface TestScope extends ng.IRootScopeService {
    ScheduledItemController:ScheduledItemController;
    testScheduledItem:CycleScheduleItem;
    testSchedule:ISchedule;
    testProgram:Program;
    testCycle:Cycle;
    testProgramOptions:ProgramOption[];
}

describe('Scheduled Item Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:ScheduledItemController,
        scheduleService:ScheduleService,
        programOptionService:ProgramOptionService,
        countriesService:CountriesService,
        $q:ng.IQService,
        $mdDialog:ng.material.IDialogService,
        $state:ng.ui.IStateService,
        notificationService:NotificationService,
        $httpBackend:ng.IHttpBackendService;

    // Mocks
    let today = momentDate(),
        optionTypes = ProgramOptionTypeMock.collection(2),
        programOptions = ProgramOptionMock.collection(4, {
            programOptionTypeId: optionTypes[0].programOptionTypeId,
            _programOptionType: optionTypes[0]
        }).concat(ProgramOptionMock.collection(4, {
            programOptionTypeId: optionTypes[1].programOptionTypeId,
            _programOptionType: optionTypes[1]
        })),
        scheduledItem = CycleScheduleItemMock.entity({
            _options: [programOptions[0]]
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
        timezone = TimezoneMock.entity({
            displayOffset: '+11:00',
            isDst: true,
            offset: 39600,
            timezoneIdentifier: 'Australia/Sydney'
        }),
        countries:Country[] = [
            CountryMock.entity({
                countryName: 'Australia',
                countryCode: 'AU'
            })
        ];

    /*
     @Todo: Fix mocks, for some RETARDED reason this returns an empty set for timezones even though we're doing the same thing with program options and types right above (something to do with _?)

     let timezone = TimezoneMock.entity({
     displayOffset: '+11:00',
     isDst: true,
     offset: 39600,
     timezoneIdentifier: 'Australia/Sydney'
     });

     CountryMock.entity({
     countryName: 'Australia',
     countryCode: 'AU',
     timezones: [timezone]
     });
     */
    countries[0].timezones.push(timezone);

    beforeEach(() => {

        angular.mock.module('app');

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            angular.mock.inject((_$compile_, _$rootScope_, _scheduleService_, _programOptionService_, _countriesService_, _$q_, _$state_, _$mdDialog_, _notificationService_, _$httpBackend_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                scheduleService = _scheduleService_;
                programOptionService = _programOptionService_;
                countriesService = _countriesService_;
                $q = _$q_;
                $state = _$state_;
                $mdDialog = _$mdDialog_;
                notificationService = _notificationService_;
                $httpBackend = _$httpBackend_;
            });

            $httpBackend.expectGET('/api/countries-timezones').respond(countries);
            countriesService.getUsersTimezone = sinon.stub().returns($q.when(countries[0].timezones[0]));

            schedule = scheduleService.getSchedule(program, cycle);

            $mdDialog.show = sinon.stub().returns($q.when(true));

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testScheduledItem = scheduledItem;
            directiveScope.testProgram = program;
            directiveScope.testSchedule = schedule;
            directiveScope.testCycle = cycle;
            directiveScope.testProgramOptions = programOptions;

            let element = angular.element(`
                    <scheduled-item ng-model="testScheduledItem"
                                    schedule="testSchedule"
                                    program="testProgram"
                                    cycle="testCycle"
                                    programOptions="testProgramOptions">
                    </scheduled-item>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).ScheduledItemController;
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('scheduled-item-directive')).to.be.true;

            expect(directiveController.selectedTimezone.timezoneIdentifier).to.deep.equal(countries[0].timezones[0].timezoneIdentifier);

        });

        it('should be able to initialise cycleOptionTypes', () => {

            sinon.spy(programOptionService, 'initializeProgramOptions');

            directiveController.initCycleOptionTypes();

            expect(programOptionService.initializeProgramOptions).to.be.called;

            expect(programOptionService.initializeProgramOptions).to.be.calledWith(directiveController.programOptions, directiveController.scheduledItem._options);

            (<any>programOptionService).initializeProgramOptions.restore();

        });

        it('should be able to navigate to edit a post', () => {

            $state.go = sinon.stub();

            let programPost = ProgramPostMock.entity();

            scheduledItem._scheduledItem = programPost;

            directiveController.editPost();

            expect($state.go).to.be.calledWith('app.admin.programs.program.cycle.schedule.programPost', {
                id: programPost.getKey()
            });

            let guide = GuideMock.entity();

            scheduledItem._scheduledItem = guide;

            directiveController.editPost();

            expect($state.go).to.be.calledWith('app.admin.guides.guide', {
                id: guide.getKey()
            });

        });

        it('should be able to open the schedule item dialog', () => {

            directiveController.scheduleItem();

            expect($mdDialog.show).to.be.called;

        });

        it('should be able to open the feed formatting dialog', () => {

            directiveController.feedFormatting();

            expect($mdDialog.show).to.be.called;

        });

        it('should be able to open the copy to dialog', () => {

            directiveController.copyTo();

            expect($mdDialog.show).to.be.called;

        });

        it('should be able to unschedule the item', () => {

            scheduleService.save = sinon.stub().returns($q.when(true));
            scheduleService.assignScheduleItemToPeriod = sinon.stub();
            notificationService.toast = sinon.stub().returns({pop: sinon.stub()});
            $mdDialog.hide = sinon.stub();

            directiveController.unschedule();

            $rootScope.$apply();

            expect(directiveController.scheduledItem.scheduledRelativeTo).to.equal(null);

            expect(scheduleService.save).to.be.calledWith(directiveController.scheduledItem);

            expect($mdDialog.hide).to.be.called;

            $rootScope.$apply();

            expect(notificationService.toast).to.be.calledWith('Item unscheduled successfully');

            expect(scheduleService.assignScheduleItemToPeriod).to.be.calledWith(directiveController.schedule, directiveController.scheduledItem);

        });
    });
});

