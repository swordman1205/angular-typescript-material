import {expect} from "../../../testBootstrap.spec";
import ProgramService, {
    STAGE_END,
    STAGE_POST_SEASON,
    STAGE_IN_PROGRESS,
    STAGE_PRE_SEASON,
    STAGE_FUTURE
} from "./programService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import momentDate from "../../libs/moment/momentDate";
import CycleMock from "../../models/cycle/cycleModel.mock";
import ProgramMock from "../../models/program/programModel.mock";
import ProgramRatePlanMock from "../../models/programRatePlan/programRatePlan.mock";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import GuideMock from "../../models/post/guide/guideModel.mock";
import TagMock from "../../models/tag/tagModel.mock";

describe('Program Service', () => {

    let programService:ProgramService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $rootScope:ng.IRootScopeService;
    let $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _programService_, _ngRestAdapter_, _$rootScope_, _$q_) => {

            if (!programService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                programService = _programService_;
                ngRestAdapter = _ngRestAdapter_;
                $rootScope = _$rootScope_;
                $q = _$q_;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(programService).to.be.an('object');
        });

    });

    describe('Utility', () => {

        describe('Cycle Timings', () => {

            it('should be able to calculate cycle end date', () => {

                let periodOneStartDate = momentDate();

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate()
                });

                let program = ProgramMock.entity({
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleEndDate.toString()).to.equal(moment(periodOneStartDate).add(program.periodCount * program.periodLength, 'days').toString());

            });

            it('should be able to determine that the cycle stage is end', () => {

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate().subtract(22, 'days'),
                    postSeasonDays: 7
                });

                let program = ProgramMock.entity({
                    periodCount: 2,
                    periodLength: 7,
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleStage).to.equal(STAGE_END);

            });

            it('should be able to determine that the cycle stage is post season', () => {

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate().subtract(17, 'days'),
                    postSeasonDays: 7
                });

                let program = ProgramMock.entity({
                    periodCount: 2,
                    periodLength: 7,
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleStage).to.equal(STAGE_POST_SEASON);

            });

            it('should be able to determine that the cycle stage is in progress', () => {

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate().subtract(1, 'days'),
                });

                let program = ProgramMock.entity({
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleStage).to.equal(STAGE_IN_PROGRESS);

            });

            it('should be able to determine that the cycle stage is pre season', () => {

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate().add(1, 'days'),
                    scheduleOnSaleStart: momentDate().subtract(1, 'days')
                });

                let program = ProgramMock.entity({
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleStage).to.equal(STAGE_PRE_SEASON);

            });

            it('should be able to determine that the cycle stage is in the future', () => {

                let cycle = CycleMock.entity({
                    periodOneStartDate: momentDate().add(7, 'days'),
                    scheduleOnSaleStart: momentDate().add(1, 'days')
                });

                let program = ProgramMock.entity({
                    _cycles: [cycle]
                });

                (<any>programService).calculateCycleTimings(program);

                expect(program._cycles[0].__cycleStage).to.equal(STAGE_FUTURE);

            });

        });

        describe('Rate Plans', () => {

            it('should be able to get rate plans for a program', () => {

                let program = ProgramMock.entity();

                $httpBackend.expectGET('/api/programs/' + program.getKey() + '/pricing').respond(ProgramRatePlanMock.collection(3));

                let promise = programService.getRatePlans(program);

                expect(promise).to.eventually.be.fulfilled;

                $httpBackend.flush();

            });

        });

        describe('Guides', () => {
            it('should be able to get the program guides', () => {
                
                let program = ProgramMock.entity();

                $httpBackend.expectGET('/api/programs/' + program.getKey() + '/guides').respond(GuideMock.collection(3));

                let promise = programService.getGuides(program);

                expect(promise).to.eventually.be.fulfilled;

                $httpBackend.flush();
                
            });

            it('should be able to get the program guides tags', () => {

                let program = ProgramMock.entity();

                $httpBackend.expectGET('/api/programs/' + program.getKey() + '/guides/tags').respond(TagMock.collection(3));

                let promise = programService.getGuideTags(program);

                expect(promise).to.eventually.be.fulfilled;

                $httpBackend.flush();

            });
        });

    });

});

