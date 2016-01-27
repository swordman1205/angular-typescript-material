import {expect} from "../../../../testBootstrap.spec";
import * as _ from "lodash";
import ProgramMock from "../../../models/program/programModel.mock";
import momentDate from "../../../libs/moment/momentDate";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import ScheduleService, {ScheduleServiceException} from "./scheduleService";
import CycleMock from "../../../models/cycle/cycleModel.mock";
import ProgramOptionService from "../programOption/programOptionService";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import CycleScheduleItemMock from "../../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import ProgramOptionTypeMock from "../../../models/programOptionType/programOptionTypeModel.mock";
import ProgramOptionMock from "../../../models/programOption/programOptionModel.mock";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";

describe('Schedule Service', () => {

    let scheduleService:ScheduleService,
        programOptionService:ProgramOptionService,
        $httpBackend:ng.IHttpBackendService,
        ngRestAdapter:NgRestAdapterService,
        today = momentDate(),
        getBlankSchedule = () => {
            let program = ProgramMock.entity({
                periodCount: 5,
                periodLength: 7
            });

            let cycle = CycleMock.entity({
                periodOneStartDate: today.clone(),
                periodInfo: [],
                postSeasonDays: 5,
                scheduleOnSaleStart: today.clone(),
                scheduleOnSalePreSaleDays: 7
            });

            return scheduleService.getSchedule(program, cycle);
        };

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _scheduleService_, _programOptionService_, _ngRestAdapter_) => {

            if (!scheduleService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                scheduleService = _scheduleService_;
                programOptionService = _programOptionService_;
                ngRestAdapter = _ngRestAdapter_;
            }

        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(scheduleService).to.be.an('object');
        });

    });

    describe('Utility', () => {

        it('should be able to return a new scheduled item', () => {

            let programOptions = ProgramOptionMock.collection(3);

            let cycle = CycleMock.entity({
                _options: programOptions
            });

            let newScheduledItem = scheduleService.newScheduledItem(cycle);

            expect(newScheduledItem).to.be.an.instanceOf(CycleScheduleItem);

            expect(newScheduledItem.cycleScheduleItemId).to.not.be.empty;
            expect(newScheduledItem.programCycleId).to.equal(cycle.getKey());
            expect(newScheduledItem.exists()).to.be.false;

            expect(newScheduledItem._options.length).to.equal(3);
            expect(_.head(newScheduledItem._options)._pivot).to.deep.equal({
                cycleScheduleItemId: newScheduledItem.cycleScheduleItemId,
                programOptionId: _.head(newScheduledItem._options).programOptionId
            });

        });

        it('should be able to get a blank schedule', () => {

            let schedule = getBlankSchedule();

            expect(schedule.periods.length).to.equal(7);

            expect(schedule.periods[0]).to.deep.equal({
                periodName: 'Pre Season',
                periodInfo: null,
                periodIndex: -1,
                periodStart: today.clone().subtract(7, 'days').startOf('day'),
                periodEnd: today.clone().subtract(1, 'days').endOf('day'),
                days: []
            });

            for (let i = 1; i < 6; i++) {

                let offset:number = (i - 1) * 7;

                expect(schedule.periods[i]).to.deep.equal({
                    periodName: 'Period ' + i,
                    periodInfo: null,
                    periodIndex: i - 1,
                    periodStart: today.clone().add(offset, 'days').startOf('day'),
                    periodEnd: today.clone().add(offset + 6, 'days').endOf('day'),
                    days: []
                }, 'Period ' + i + ' data is not correct');

            }

            expect(schedule.periods[6]).to.deep.equal({
                periodName: 'Post Season',
                periodInfo: null,
                periodIndex: 6,
                periodStart: today.clone().add(35, 'days').startOf('day'),
                periodEnd: today.clone().add(40, 'days').endOf('day'),
                days: []
            });

        });

        it('should be able to add and move a scheduled item', () => {

            let schedule = getBlankSchedule();

            let unscheduledItemOne = CycleScheduleItemMock.entity({
                scheduledRelativeTo: null
            });

            scheduleService.assignScheduleItemToPeriod(schedule, unscheduledItemOne, true);

            expect(schedule.unscheduledItems[0]).to.deep.equal(unscheduledItemOne);

            let unscheduledItemTwo = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
                __scheduleDateTime: today.clone().add(100, 'days')
            });

            scheduleService.assignScheduleItemToPeriod(schedule, unscheduledItemTwo, true);

            expect(schedule.unscheduledItems[1]).to.deep.equal(unscheduledItemTwo);

            let scheduledItem = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
                __scheduleDateTime: today.clone().add(3, 'days')
            });

            scheduleService.assignScheduleItemToPeriod(schedule, scheduledItem, true);

            expect(schedule.periods[1].days[0].scheduleItems.length).to.equal(1);

            expect(schedule.periods[1].days[0].scheduleItems[0]).to.deep.equal(scheduledItem);

            // Add a second item to the same day to allow us to test the relocation of a scheduled
            // item within a day (if the last item in a day is moved, the day is removed

            let scheduledItemTwo = CycleScheduleItemMock.entity({
                scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
                __scheduleDateTime: today.clone().add(3, 'days')
            });

            scheduleService.assignScheduleItemToPeriod(schedule, scheduledItemTwo, true);

            expect(schedule.periods[1].days[0].scheduleItems.length).to.equal(2);

            // Move the first item to another day

            scheduledItem.__scheduleDateTime = today.clone().add(10, 'days');

            scheduleService.assignScheduleItemToPeriod(schedule, scheduledItem);

            expect(schedule.periods[1].days[0].scheduleItems.length).to.equal(1);

            expect(schedule.periods[2].days[0].scheduleItems.length).to.equal(1);

            expect(schedule.periods[2].days[0].scheduleItems[0]).to.deep.equal(scheduledItem);

            // Move the second item

            scheduledItemTwo.__scheduleDateTime = today.clone().add(11, 'days');

            scheduleService.assignScheduleItemToPeriod(schedule, scheduledItemTwo);

            expect(schedule.periods[1].days.length).to.equal(0);

            expect(schedule.periods[2].days[1].scheduleItems.length).to.equal(1);

            expect(schedule.periods[2].days[1].scheduleItems[0]).to.deep.equal(scheduledItemTwo);

        });

        it('should be able to add items to schedule', () => {

            let schedule = getBlankSchedule();
            let scheduleItems = CycleScheduleItemMock.collection(5);

            sinon.spy(scheduleService, 'setScheduleItemDate');
            sinon.spy(scheduleService, 'assignScheduleItemToPeriod');

            scheduleService.addItemsToSchedule(schedule, scheduleItems);

            _.forEach(scheduleItems, scheduleItem => {

                expect(scheduleService.setScheduleItemDate).to.be.calledWith(schedule, scheduleItem);

                expect(scheduleService.assignScheduleItemToPeriod).to.be.calledWith(schedule, scheduleItem, true);

            });

            (<any>scheduleService).setScheduleItemDate.restore();

            (<any>scheduleService).assignScheduleItemToPeriod.restore();

        });

        describe('Schedule Item Date', () => {

            let time = moment.duration('13:03:01');

            it('should be able to set __scheduleDateTime when scheduledRelativeTo is \'global\'', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeGlobal,
                    scheduleDate: today.clone(),
                    scheduleTime: time
                });

                scheduleService.setScheduleItemDate(schedule, scheduledItem);

                expect(scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.deep.equal(moment.utc(today.format('YYYY-MM-DD') + ' ' + time.format()).format('YYYY-MM-DD HH:mm:ss'));

            });

            it('should be able to set __scheduleDateTime when scheduledRelativeTo is \'timezone\'', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
                    scheduleDate: today.clone(),
                    scheduleTime: time
                });

                scheduleService.setScheduleItemDate(schedule, scheduledItem);

                expect(scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.deep.equal(moment(today.format('YYYY-MM-DD') + ' ' + time.format()).format('YYYY-MM-DD HH:mm:ss'));

            });

            it('should be able to set __scheduleDateTime when scheduledRelativeTo is \'period\'', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypePeriod,
                    scheduledRelativeToPeriodDays: 1,
                    scheduleTime: time,
                    periodIndex: 0
                });

                scheduleService.setScheduleItemDate(schedule, scheduledItem);

                expect(scheduledItem.__scheduleDateTime.format('YYYY-MM-DD HH:mm:ss')).to.deep.equal(moment(today.add(1, 'days').format('YYYY-MM-DD') + ' ' + time.format()).format('YYYY-MM-DD HH:mm:ss'));

            });

            it('should be able to set __scheduleDateTime when scheduledRelativeTo is null', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: null
                });

                scheduleService.setScheduleItemDate(schedule, scheduledItem);

                expect(scheduledItem.__scheduleDateTime).to.equal(null);

            });

            it('should throw an exception when __scheduleDateTime is not a valid moment object', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypeTimezone,
                    scheduleDate: null,
                    scheduleTime: null
                });

                expect(() => {
                    scheduleService.setScheduleItemDate(schedule, scheduledItem);
                }).to.throw(ScheduleServiceException);

            });

            it('should throw an exception when a period scheduled item is scheduled in a period which doesn\'t exist', () => {

                let schedule = getBlankSchedule();

                let scheduledItem = CycleScheduleItemMock.entity({
                    scheduledRelativeTo: CycleScheduleItem.scheduledRelativeToTypePeriod,
                    scheduledRelativeToPeriodDays: 1,
                    scheduleTime: time,
                    periodIndex: 20
                });

                expect(() => {
                    scheduleService.setScheduleItemDate(schedule, scheduledItem);
                }).to.throw(ScheduleServiceException);

            });

        });

        it('should be able to validate program option selection', () => {

            let optionTypes = ProgramOptionTypeMock.collection(2);

            let programOptions = ProgramOptionMock.collection(4, {
                programOptionTypeId: optionTypes[0].programOptionTypeId,
                _programOptionType: optionTypes[0]
            }).concat(ProgramOptionMock.collection(4, {
                programOptionTypeId: optionTypes[1].programOptionTypeId,
                _programOptionType: optionTypes[1]
            }));

            let scheduledItem = CycleScheduleItemMock.entity({
                _options: [programOptions[1], programOptions[4], programOptions[5]]
            });

            let programOptionTypes = programOptionService.initializeProgramOptions(programOptions, scheduledItem._options);

            expect(scheduleService.validateProgramOptionSelection(programOptionTypes[0].programOptions[1], programOptionTypes)).to.be.false;

            expect(scheduleService.validateProgramOptionSelection(programOptionTypes[1].programOptions[1], programOptionTypes)).to.be.true;

            expect(scheduleService.validateProgramOptionSelection(programOptionTypes[1].programOptions[2], programOptionTypes)).to.be.true;

        });

        it('should be able to copy a scheduled item to another cycle', () => {

            let scheduledItem = CycleScheduleItemMock.entity();
            let cycle = CycleMock.entity();

            $httpBackend.expectPUT('/api/cycle-scheduled-items/' + scheduledItem.getKey() + '/copy-to-cycle/' + cycle.getKey()).respond(204);

            let promise = scheduleService.copyScheduledItem(scheduledItem, cycle);

            expect(promise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

    });

    describe('Save', () => {

        it('should be able to save a scheduled item and all it\'s related entities', () => {

            let scheduledItem = CycleScheduleItemMock.entity({
                stickyInFeed: false
            });
            scheduledItem.stickyInFeed = true;
            scheduledItem._options = ProgramOptionMock.collection(2);

            (<any>scheduleService).cleanUpScheduleItem = sinon.stub();

            $httpBackend.expectPATCH('/api/cycles/' + scheduledItem.programCycleId + '/scheduled-items/' + scheduledItem.cycleScheduleItemId).respond(201);

            $httpBackend.expectPUT('/api/cycle-scheduled-items/' + scheduledItem.cycleScheduleItemId + '/options').respond(201);

            let savePromise = scheduleService.save(scheduledItem);

            expect((<any>scheduleService).cleanUpScheduleItem).to.be.called;
            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(scheduledItem);

            $httpBackend.flush();

        });

    });

    describe('Feed format option retrieval', () => {

        let mockFeedFormatting = [{key: 'example'}];

        beforeEach(() => {

            sinon.spy(ngRestAdapter, 'get');

        });

        afterEach(() => {
            (<any>ngRestAdapter.get).restore();
        });

        it('should be able to retrieve a list of feed formatting options', () => {

            $httpBackend.expectGET('/api/cycle-scheduled-items/feed-formatting-options').respond(mockFeedFormatting);

            let allFeedFormattingOptionsPromise = scheduleService.getFeedFormatOptions();

            expect(allFeedFormattingOptionsPromise).eventually.to.be.fulfilled;
            expect(allFeedFormattingOptionsPromise).eventually.to.deep.equal(mockFeedFormatting);

            $httpBackend.flush();

        });

        it('should return all feed formatting options from cache', () => {

            let allFeedFormattingOptionsPromise = scheduleService.getFeedFormatOptions();

            expect(allFeedFormattingOptionsPromise).eventually.to.be.fulfilled;
            expect(allFeedFormattingOptionsPromise).eventually.to.deep.equal(mockFeedFormatting);

            expect(ngRestAdapter.get).not.to.have.been.called;

        });

    });

});

