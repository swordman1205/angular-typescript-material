import {expect} from "../../../../testBootstrap.spec";
import MealPlanService from "./mealPlanService";
import MealDay from "../../../models/mealDay/mealDayModel";
import MealDayMock from "../../../models/mealDay/mealDayModel.mock";
import UserMock from "../../../models/user/userModel.mock";
import User from "../../../models/user/userModel";
import MealPlanMock from "../../../models/mealPlan/mealPlanModel.mock";
import MealPlan from "../../../models/mealPlan/mealPlanModel";
import Recipe from "../../../models/recipe/recipeModel";
import RecipeMock from "../../../models/recipe/recipeModel.mock";

//TODO: Tests for the remainder of meal plan service
describe('Meal Plan Service', () => {

    let mealPlanService:MealPlanService,
        $httpBackend:ng.IHttpBackendService,
        $q:ng.IQService;

    // Mocks
    let user:User = UserMock.entity(),
        mealPlan:MealPlan = MealPlanMock.entity(),
        recipe:Recipe = RecipeMock.entity()
        ;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _mealPlanService_, _$q_) => {

            if (!mealPlanService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                mealPlanService = _mealPlanService_;
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
            return expect(mealPlanService).to.be.an('object');
        });

    });

    describe('Utility', () => {
        it('should be able to grant complimentary access', () => {

            $httpBackend.expectPUT('/api' + mealPlanService.apiEndpoint(mealPlan) + '/access-complimentary/' + user.getKey()).respond(201);
            let result = mealPlanService.grantComplimentaryAccess(mealPlan, user, {});
            expect(result).eventually.to.be.fulfilled;
            $httpBackend.flush();
        });

        it('should be able to save a meal plan', () => {

            $httpBackend.expectPATCH('/api' + mealPlanService.apiEndpoint(mealPlan)).respond(204);
            mealPlan.title = mealPlan.title + ' copy';
            let result = mealPlanService.save(mealPlan);
            expect(result).eventually.to.be.fulfilled;
            $httpBackend.flush();
        });

        it('should be able to save related entities eg recipes', () => {

            $httpBackend.expectPUT('/api' + mealPlanService.apiEndpoint(mealPlan) + '/recipes/' + recipe.getKey()).respond(201);
            mealPlan._recipes = [recipe];
            let result = mealPlanService.save(mealPlan);
            expect(result).eventually.to.be.fulfilled;
            $httpBackend.flush();
        });
    });
});

