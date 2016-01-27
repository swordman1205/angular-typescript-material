import MealPeriodService from "./mealPeriodService";
import MealPeriod from "../../../models/mealPeriod/mealPeriodModel";
import MealPeriodMock from "../../../models/mealPeriod/mealPeriodModel.mock";
import {expect} from "../../../../testBootstrap.spec";
describe('Meal Period Service', () => {

    let mealPeriodService:MealPeriodService,
        $httpBackend:ng.IHttpBackendService,
        $q:ng.IQService;

    // Mocks, if any
    let mealPeriod:MealPeriod = MealPeriodMock.entity();

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _mealPeriodService_, _$q_) => {

            if (!mealPeriodService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                mealPeriodService = _mealPeriodService_;
                $q = _$q_;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it.skip('should be able to determine period index', () => {

        // @Todo: Write me
        // getPeriodIndex

    });

    it('should be able to download meal period PDF', () => {

        $httpBackend.expectGET('/api' + mealPeriodService.apiEndpoint(mealPeriod) + '/pdf').respond(200);
        let result = mealPeriodService.getDownloadLink(mealPeriod);
        expect(result).eventually.to.be.fulfilled;
        $httpBackend.flush();
    });

});