import {expect} from "../../../../testBootstrap.spec";
import ProgramMock from "../../../models/program/programModel.mock";
import Program from "../../../models/program/programModel";
import CycleService, {IGetInvoiceBody} from "./cycleService";
import Cycle from "../../../models/cycle/cycleModel";
import {LinkingTagMock} from "../../../models/tag/tagModel.mock";
import UserMock from "../../../models/user/userModel.mock";
import CycleMock from "../../../models/cycle/cycleModel.mock";
import ProgramOptionMock from "../../../models/programOption/programOptionModel.mock";
import {ISchedulePeriod} from "../schedule/scheduleService";
import ProgramRatePlanMock from "../../../models/programRatePlan/programRatePlan.mock";

describe('Cycle Service', () => {

    let cycleService:CycleService,
        $httpBackend:ng.IHttpBackendService,
        $q:ng.IQService;

    // Mocks
    let program:Program = ProgramMock.entity();

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _cycleService_, _$q_) => {

            if (!cycleService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                cycleService = _cycleService_;
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

            return expect(cycleService).to.be.an('object');
        });

    });

    describe('New Cycle', () => {

        it('should be able to return a new instance of a cycle', () => {

            let newCycle = cycleService.newCycle(program);

            expect(newCycle).to.be.an.instanceOf(Cycle);

            expect(newCycle.programCycleId).to.not.be.empty;

            expect(newCycle.scheduleOnSaleStart).to.not.be.null;
            expect(newCycle.scheduleOnSaleEnd).to.not.be.null;
            expect(newCycle.periodOneStartDate).to.not.be.null;
            expect(newCycle.generalAccessStart).to.not.be.null;

        });

    });

    describe('Save', () => {

        it('should be able to save a program cycle and all it\'s related entities', () => {

            let cycle = cycleService.newCycle(program);

            cycle._tags = LinkingTagMock.collection(4);
            cycle._ambassadors = UserMock.collection(2);
            cycle._experts = UserMock.collection(2);

            $httpBackend.expectPUT('/api/cycles/' + cycle.programCycleId).respond(201);

            $httpBackend.expectPUT('/api/cycles/' + cycle.programCycleId + '/tags').respond(201);

            $httpBackend.expectPUT('/api/cycles/' + cycle.programCycleId + '/ambassadors').respond(201);

            $httpBackend.expectPUT('/api/cycles/' + cycle.programCycleId + '/experts').respond(201);

            let savePromise = cycleService.save(cycle);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(cycle);

            $httpBackend.flush();

        });

    });

    describe('Utility', () => {

        it('should be able to get program options for a cycle', () => {

            let cycle = CycleMock.entity();

            $httpBackend.expectGET('/api/cycles/' + cycle.programCycleId + '/options').respond(ProgramOptionMock.collection(4));

            let savePromise = cycleService.getCycleOptions(cycle);

            expect(savePromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

        it('should be able to save period info', () => {

            cycleService.saveModel = sinon.stub().returns($q.when(true));

            let cycle = CycleMock.entity({
                periodInfo: [{
                    index: -1,
                    name: 'foobar',
                    info: 'HelloWorld'
                },
                    {
                        index: 0,
                        name: 'barfoo',
                        info: null
                    }]
            });

            let period:ISchedulePeriod = {
                periodName: 'raboof',
                periodInfo: 'dlroWolleH',
                periodIndex: -1,
                periodStart: null,
                periodEnd: null,
                days: []
            };

            let savePromise = cycleService.savePeriodInfo(cycle, period);

            expect(cycle.periodInfo).to.deep.equal([
                {
                    index: -1,
                    name: 'raboof',
                    info: 'dlroWolleH'
                }, {
                    index: 0,
                    name: 'barfoo',
                    info: null
                }]);

            expect(cycleService.saveModel).to.be.calledWith(cycle);

            expect(savePromise).eventually.to.be.fulfilled;

        });

        it('should be able to duplicate another cycle\'s scheduled items', () => {

            let cycle = cycleService.newCycle(program);
            let existingCycle = CycleMock.entity();

            $httpBackend.expectPUT('/api/cycles/' + cycle.programCycleId + '/scheduled-items/copy-from-cycle/' + existingCycle.programCycleId).respond(201);

            let promise = cycleService.duplicateCycle(cycle, existingCycle);

            expect(promise).eventually.to.be.fulfilled;
            expect(promise).eventually.to.deep.equal(cycle);

            $httpBackend.flush();

        });

        it('should be able to get an invoice', () => {

            let cycle = CycleMock.entity({
                    programCycleId: 'foobar'
                }),
                ratePlan = ProgramRatePlanMock.entity(),
                request = <IGetInvoiceBody>{
                    promoCode: 'IQSSTAFF',
                    currency: 'AUD',
                    country: 'AU',
                    state: null
                };

            $httpBackend.expectPOST('/api/cycles/foobar/pricing/rate-plans/' + ratePlan.ratePlanId, request).respond(201);

            let promise = cycleService.getInvoice(cycle, ratePlan, 'IQSSTAFF', 'AUD', 'AU');

            expect(promise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

    });

});

