import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import ArticleMock from "../../models/post/article/articleModel.mock";
import Article from "../../models/post/article/articleModel";
import {ScheduleToolbarController} from "./scheduleToolbar";
import CountriesService from "../../services/countries/countriesService";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import Country from "../../models/country/countryModel";
import CountryMock from "../../models/country/countryModel.mock";
import TimezoneMock from "../../models/timezone/timezoneModel.mock";

interface TestScope extends ng.IRootScopeService {
    ScheduleToolbarController:ScheduleToolbarController<Article>;
    testEntity:Article;
    testToggleSchedule:Function;
}

describe('Schedule Toolbar Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:ScheduleToolbarController<Article>,
        $mdpTimePicker,
        $q:ng.IQService,
        countriesService:CountriesService,
        $httpBackend:ng.IHttpBackendService;

    // Mocks
    let initialPublished = moment('2016-01-01 12:00:00'),
        article = ArticleMock.entity({
            published: initialPublished
        }),
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
        ];

    countries[0].timezones.push(timezone);

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$mdpTimePicker_, _$q_, _countriesService_, _$httpBackend_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $mdpTimePicker = _$mdpTimePicker_;
            $q = _$q_;
            countriesService = _countriesService_;
            $httpBackend = _$httpBackend_;
        });

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            $httpBackend.expectGET('/api/countries-timezones').respond(countries);
            countriesService.getUsersTimezone = sinon.stub().returns($q.when(countries[0].timezones[0]));

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testEntity = article;
            directiveScope.testToggleSchedule = sinon.stub();

            let element = angular.element(`
                    <schedule-toolbar ng-model="testEntity"
                                      toggle-schedule="testToggleSchedule">
                    </schedule-toolbar>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).ScheduleToolbarController;
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('schedule-toolbar-directive')).to.be.true;
            expect(directiveController.selectedTimezone).to.deep.equal(countries[0].timezones[0]);

        });

    });

    describe('Functionality', () => {

        it('should be able to update the time', () => {

            (<any>directiveController).$mdpTimePicker = sinon.stub().returns($q.when('2016-02-02 14:53:22'));

            directiveController.showTimePicker(null);

            let convertedDate = new Date(article.published.format('YYYY/MM/DD HH:mm:ss'));

            expect((<any>directiveController).$mdpTimePicker).to.be.calledWith(null, convertedDate);

            $rootScope.$apply();

            expect(directiveController.entity.published.hour()).to.equal(14);
            expect(directiveController.entity.published.minute()).to.equal(53);
            expect(directiveController.entity.published.second()).to.equal(22);

        });

        it('should be able to update the date', () => {

            let today = moment();

            directiveController.entity.published = today;

            expect(article.published).to.deep.equal(today);

        });

        it('should be able to close the toolbar', () => {

            (<any>directiveController).entityChangedHandler = sinon.stub();

            directiveController.toggleSchedule = sinon.stub();

            directiveController.entity.published = moment.utc('2016-01-01 23:00:00');

            directiveController.selectedTimezone = countries[0].timezones[0]; // +11 :00 offset

            directiveController.closeToolbar();

            expect(directiveController.entity.published.format('YYYY-MM-DD HH:mm:ss')).to.equal('2016-01-01 12:00:00');

            expect((<any>directiveController).entityChangedHandler).to.be.calledWith(directiveController.entity);

            expect(directiveController.toggleSchedule).to.be.called;

        });

    });

});

