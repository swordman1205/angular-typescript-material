import {expect} from "../../../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import ProgramMock from "../../../../models/program/programModel.mock";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import FeedService from "./feedService";
import CycleMock from "../../../../models/cycle/cycleModel.mock";
import MealPlanMock from "../../../../models/mealPlan/mealPlanModel.mock";
import ProgramPostMock from "../../../../models/post/programPost/programPostModel.mock";
import CycleScheduleItemMock from "../../../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import CycleScheduleItem from "../../../../models/cycleScheduleItem/cycleScheduleItemModel";
import MealDayMock from "../../../../models/mealDay/mealDayModel.mock";
import MealDayService from "../../mealDay/mealDayService";

describe('Feed Service', () => {

    let feedService:FeedService,
        $httpBackend:ng.IHttpBackendService,
        ngRestAdapter:NgRestAdapterService,
        $window:ng.IWindowService;

    //mocks
    let program = ProgramMock.entity();
    let today = moment();

    let cycle = CycleMock.entity({
        periodOneStartDate: today.clone().subtract(1, 'd'),
    });
    cycle.programId = program.getKey();
    cycle._program = program;

    let currentMealPlan = MealPlanMock.entity();
    currentMealPlan.programCycleId = cycle.getKey();
    currentMealPlan._cycle = cycle;

    let localStorageGetItem:Sinon.SinonStub;
    let localStorageSetItem:Sinon.SinonStub;
    let localStore:string = null;
    let withNestedHeadersExpectation = (headers:Object) => {
        return headers['With-Nested'] == 'scheduledItem.categoryTag, scheduledItem.commentsCount';
    };

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _feedService_, _ngRestAdapter_, _$window_) => {

            if (!feedService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                feedService = _feedService_;
                ngRestAdapter = _ngRestAdapter_;
                $window = _$window_;
            }

        });

        $window.localStorage.clear();

        //getter
        localStorageGetItem = sinon.stub($window.localStorage, 'getItem');
        localStorageGetItem.withArgs(FeedService.announcementDismissalStorageKey).returns(localStore);

        //setter
        localStorageSetItem = sinon.stub($window.localStorage, 'setItem', (key, value) => {
            if (key == FeedService.announcementDismissalStorageKey) {
                localStore = value;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();

        localStorageGetItem.restore();
        localStorageSetItem.restore();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(feedService).to.be.an('object');
        });

        it('should not add meal plan to feed if we\'re in pre-season before meal plan early access', () => {

            let testMealPlan = MealPlanMock.entity();
            let testCycle = CycleMock.entity({
                periodOneStartDate: today.clone().add(4, 'd'),
                mealPeriodEarlyAccessDays: 3
            });
            testCycle._program = program;
            testMealPlan._cycle = testCycle;

            feedService.initializeFeed(program, testCycle, testMealPlan).resetFeed();

            expect(feedService.allFeedItems).to.have.length(0);

        });

        it('should be able to initialize the feed', () => {

            let res = feedService.initializeFeed(program, cycle, currentMealPlan).resetFeed();

            expect(res).to.equal(feedService);
            expect(feedService.allFeedItems).to.be.instanceOf(Array);
            expect(feedService.allFeedItems).to.have.length(1); //the meal plan should be pushed in
        });
    });

    describe('Feed item retrieval', () => {

        it('should be able to get feed items', () => {

            expect(feedService.allFeedItems).to.have.length(1); //check the feed is initialized

            let feedItemsResponse = [
                CycleScheduleItemMock.entity({
                    _scheduledItem: ProgramPostMock.entity(),
                    scheduledItemType: 'ProgramPost',
                    stickyInFeed: false,
                }),
            ];

            $httpBackend.expectGET(`/api/cycles/${cycle.getKey()}/scheduled-items/feed`, withNestedHeadersExpectation).respond(feedItemsResponse);

            let response = feedService.getFeedItems(1);

            expect(response).eventually.to.be.fulfilled;

            response.then((results) => {
                expect(results[0]).to.be.instanceOf(CycleScheduleItem);
                expect(feedService.allFeedItems).to.have.length(2); //check the feed is initialized
            });

            $httpBackend.flush();

        });

        it('check type and feed intialisation', () => {

            let feedItemsResponse = [
                CycleScheduleItemMock.entity({
                    _scheduledItem: ProgramPostMock.entity(),
                    scheduledItemType: 'ProgramPost',
                    stickyInFeed: true,
                }),
            ];

            $httpBackend.expectGET(`/api/cycles/${cycle.getKey()}/scheduled-items/feed`, withNestedHeadersExpectation).respond(feedItemsResponse);

            let response = feedService.getFeedItems(1);

            expect(response).eventually.to.be.fulfilled;

            response.then((results) => {
                expect(results[0]).to.be.instanceOf(CycleScheduleItem);
                expect(feedService.allFeedItems).to.have.length(3); //check the feed is initialized
            });

            $httpBackend.flush();

        });

        it('should be able to dismiss a notification', () => {

            let lengthStart = feedService.allFeedItems.length;

            let dismissItem = feedService.allFeedItems[1];

            feedService.dismissAnnouncement(dismissItem);
            expect(feedService.allFeedItems).to.have.length(lengthStart - 1);
            expect(localStorageSetItem).to.have.been.calledWith(FeedService.announcementDismissalStorageKey, angular.toJson([dismissItem.getKey()]));
            expect(_.find(feedService.allFeedItems, {cycleScheduleItemId: dismissItem.getKey()})).to.be.undefined;

        });

        it('should remove an already dismissed item from the feed, and re-request an item to fill the gap', () => {

            let dismissed = (<any>feedService).getDismissed();

            let feedItemsResponse1 = [
                CycleScheduleItemMock.entity({
                    cycleScheduleItemId: dismissed[0],
                    _scheduledItem: ProgramPostMock.entity(),
                    scheduledItemType: 'ProgramPost',
                    stickyInFeed: true,
                }),
            ];

            let feedItemsResponse2 = [
                CycleScheduleItemMock.entity({
                    _scheduledItem: ProgramPostMock.entity(),
                    scheduledItemType: 'ProgramPost',
                    stickyInFeed: false,
                }),
            ];

            $httpBackend.expectGET(`/api/cycles/${cycle.getKey()}/scheduled-items/feed`, withNestedHeadersExpectation).respond(feedItemsResponse1);

            $httpBackend.expectGET(`/api/cycles/${cycle.getKey()}/scheduled-items/feed`, withNestedHeadersExpectation).respond(feedItemsResponse2);

            let response = feedService.getFeedItems(1);

            expect(response).eventually.to.be.fulfilled;
            expect(feedService.isLiveFeed()).to.be.true;

            response.then((results) => {
                expect(feedService.allFeedItems).to.have.length(3); //check the feed is initialized
                expect(_.find(feedService.allFeedItems, {cycleScheduleItemId: dismissed[0]})).to.be.undefined;
            });

            $httpBackend.flush();

        });

    });

    describe('Period index retrieval', () => {

        it('should return period indexes for the current meal plan', () => {

            let indexes = feedService.getPeriodDayIndexes();

            expect(_.isNumber(indexes.dayIndex)).to.be.true;
            expect(_.isNumber(indexes.periodIndex)).to.be.true;

        });

        it('should be able to retrieve the current meal day based on the meal plan indexes', () => {

            let indexes = feedService.getPeriodDayIndexes();

            let mockDay = MealDayMock.entity();

            $httpBackend.expectGET(`/api/meal-plans/${currentMealPlan.getKey()}/periods/${indexes.periodIndex}/days/${indexes.dayIndex}`, (headers:Object) => {
                return headers['With-Nested'] == 'meals.recipes';
            }).respond(mockDay);

            let response = feedService.getCurrentMealPlanDay();

            expect(response).eventually.to.be.fulfilled;
            expect(response).eventually.to.deep.equal(mockDay);

            $httpBackend.flush();

        });

        it('should be able to get the current meal day if we\'re in pre-season', () => {

            let testFeedService:FeedService,
                testMealDayService:MealDayService;

            angular.mock.inject((_feedService_, _mealDayService_) => {

                testFeedService = _feedService_;
                testMealDayService = _mealDayService_;

                testMealDayService.getModel = sinon.stub();

                testFeedService.initializeFeed(program, cycle, currentMealPlan).resetFeed();

                testFeedService.getPeriodDayIndexes = sinon.stub().returns({
                    periodIndex: -1,
                    dayIndex: -1,
                });

                testFeedService.getCurrentMealPlanDay();

                expect(testMealDayService.getModel).to.be.calledWith('', ['meals.recipes'], '/meal-plans/' + currentMealPlan.getKey() + '/periods/0/days/0');
            });

        });

    });

    describe('Current Feed Items', () => {

        it('should be able to set the current feed item', () => {

            expect(feedService.allFeedItems).to.have.length.greaterThan(0); //check the feed is initialized

            feedService.setCurrentItem(feedService.allFeedItems[0]);

            expect(feedService.currentFeedItem).to.equal(feedService.allFeedItems[0]);
        });

        it('should be able to get a relative feed item', () => {

            expect(feedService.allFeedItems).to.have.length.greaterThan(1); //check the feed is initialized

            let relativeItem = feedService.getRelativeFeedItem(feedService.allFeedItems[1], -1);

            expect(relativeItem).to.equal(feedService.allFeedItems[0]);
        });

    });

    describe('Offset retrieval', () => {

        it('should be able to retrieve feed items given a period offset', () => {

            let feedItemsResponse = [
                CycleScheduleItemMock.entity({
                    _scheduledItem: ProgramPostMock.entity(),
                    scheduledItemType: 'ProgramPost',
                    stickyInFeed: false,
                }),
            ];

            let offset:number = 3;

            $httpBackend.expectGET(`/api/cycles/${cycle.getKey()}/scheduled-items/feed?max-period-index=${offset}`, withNestedHeadersExpectation).respond(feedItemsResponse);

            let response = feedService.setPeriodIndexOffset(3).resetFeed().getFeedItems(1);

            expect(response).eventually.to.be.fulfilled;

            response.then((results) => {
                expect(results[0]).to.be.instanceOf(CycleScheduleItem);
                expect(feedService.allFeedItems).to.have.length(1); //check the feed is initialized
            });

            expect(feedService.isLiveFeed()).to.be.false;

            $httpBackend.flush();

        });

        it('should be able to clear the offset period index', () => {

            feedService.clearPeriodIndexOffset();

            expect(feedService.isLiveFeed()).to.be.true;
            expect((<any>feedService).maxPeriod).to.be.null;

        });

    });

});

