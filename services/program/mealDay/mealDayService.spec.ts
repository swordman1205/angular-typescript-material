import {expect} from "../../../../testBootstrap.spec";
import MealDayService from "./mealDayService";
import MealDay from "../../../models/mealDay/mealDayModel";
import MealDayMock from "../../../models/mealDay/mealDayModel.mock";

describe('MealDay Service', () => {

    let mealDayService:MealDayService,
        $httpBackend:ng.IHttpBackendService,
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _mealDayService_, _$q_) => {

            if (!mealDayService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                mealDayService = _mealDayService_;
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

            return expect(mealDayService).to.be.an('object');
        });

    });

    describe('New MealDay', () => {

        it('should be able to return a new instance of a mealDay', () => {

            let newMealDay = mealDayService.newMealDay();

            expect(newMealDay).to.be.an.instanceOf(MealDay);

            expect(newMealDay.mealDayId).to.not.be.empty;
        });

    });

    describe('Meal day retrieval', () => {

        it('should be able to retrieve a day of meals with period/day offsets', () => {

            let mealPlanId = chance.guid(),
                periodIndex = 3,
                dayIndex = 4;

            let mealDay = MealDayMock.entity();

            $httpBackend.expectGET(`/api/meal-plans/${mealPlanId}/periods/${periodIndex}/days/${dayIndex}`, (headers:Object) => {
                return headers['With-Nested'] == 'meals.recipes';
            }).respond(mealDay);

            let mealDayPromise = mealDayService.getModel<MealDay>('', ['meals.recipes'], `/meal-plans/${mealPlanId}/periods/${periodIndex}/days/${dayIndex}`);

            expect(mealDayPromise).eventually.to.be.fulfilled;
            expect(mealDayPromise).eventually.to.deep.equal(mealDay);

            $httpBackend.flush();

        });

        it('should be able to retrieve a day of meals with id', () => {

            let mealDay = MealDayMock.entity();

            $httpBackend.expectGET(`/api/meal-days/${mealDay.getKey()}`).respond(mealDay);

            let mealDayPromise = mealDayService.getModel(mealDay.getKey());

            expect(mealDayPromise).eventually.to.be.fulfilled;
            expect(mealDayPromise).eventually.to.deep.equal(mealDay);

            $httpBackend.flush();

        });

    });

});

