import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {UserCountrySelectController} from "./userCountrySelect";
import User from "../../models/user/userModel";
import IFormController = angular.IFormController;
import UserMock from "../../models/user/userModel.mock";
import {FormControllerMock} from "../../../global.mock";
import CountriesService from "../../services/countries/countriesService";
import State from "../../models/state/stateModel";
import StateMock from "../../models/state/stateModel.mock";
import CountryMock from "../../models/country/countryModel.mock";
import TimezoneMock from "../../models/timezone/timezoneModel.mock";

interface TestScope extends ng.IRootScopeService {
    UserCountrySelectController:UserCountrySelectController;
    testUser:User;
    testForm:IFormController;
}

describe('User Country Select Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:UserCountrySelectController,
        $q:ng.IQService,
        countriesService:CountriesService;

    let mockUser:User = UserMock.entity(),
        mockForm:IFormController = FormControllerMock.getMock(),
        mockCountries = [CountryMock.entity({
            countryName: 'Australia',
            countryCode: 'AU'
        })],
        mockStates:State[] = StateMock.collection(5);

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_, _countriesService_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            countriesService = _countriesService_;

            countriesService.getAllCountries = sinon.stub().returns($q.when(mockCountries));
        });

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testUser = mockUser;
            directiveScope.testForm = mockForm;

            let element = angular.element(`
                    <user-country-select ng-model="testUser"
                                         form="testForm">
                    </user-country-select>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).UserCountrySelectController;
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('user-country-select-directive')).to.be.true;

            expect(directiveController.countries).to.deep.equal(mockCountries);

        });

    });

    describe('Utility', () => {

        it('should be able to handle a country change (user country has states)', () => {

            directiveController.userChanged = sinon.stub();

            (<any>directiveController).countriesService.getCountryStates = sinon.stub().returns($q.when(mockStates));

            directiveController.user.country = 'US';

            directiveController.countryChanged();

            expect(directiveController.userChanged).to.be.called;

            $rootScope.$apply();

            expect(angular.copy(directiveController.states)).to.deep.equal(mockStates);

        });

        it('should be able to handle a country change (user country has no states)', () => {

            directiveController.userChanged = sinon.stub();

            directiveController.user.country = 'AU';

            directiveController.countryChanged();

            expect(directiveController.userChanged).to.be.called;

            expect(directiveController.states).to.deep.equal([]);

        });

        it('should be able to register form controls', () => {

            directiveController.form.$addControl = sinon.stub();

            directiveController.registerControls();

            expect(directiveController.form.$addControl).to.be.calledTwice;

        });

    });

});

