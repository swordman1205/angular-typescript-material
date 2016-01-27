import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";
import {RatePlanSelectController} from "./ratePlanSelect";
import ProgramRatePlanMock from "../../models/programRatePlan/programRatePlan.mock";
import ProgramRatePlanCurrencyAmountMock from "../../models/programRatePlan/programRatePlan.mock";

interface TestScope extends ng.IRootScopeService {
    RatePlanSelectController:RatePlanSelectController;
    testRatePlans:ProgramRatePlan[];
    testModel:ProgramRatePlan;
    testDisplayCurrency:string;
    testSelectedRatePlanType:string;
}

describe('Rate Plan Select Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:RatePlanSelectController;

    // Mocks
    let ratePlans = ProgramRatePlanMock.collection(10, {
            _currencyAmounts: [
                ProgramRatePlanCurrencyAmountMock.entity({
                    currency: 'AUD'
                }),
                ProgramRatePlanCurrencyAmountMock.entity({
                    currency: 'GBP'
                }),
                ProgramRatePlanCurrencyAmountMock.entity({
                    currency: 'USD'
                })
            ]
        }),
        selectedRatePlan:ProgramRatePlan = null,
        displayCurrency:string = 'AUD',
        selectedRatePlanType:string = ProgramRatePlan.TYPE_UP_FRONT;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testRatePlans = ratePlans;
            directiveScope.testModel = selectedRatePlan;
            directiveScope.testDisplayCurrency = displayCurrency;
            directiveScope.testSelectedRatePlanType = selectedRatePlanType;

            let element = angular.element(`
                    <rate-plan-select ng-model="testModel"
                                      rate-plans="testRatePlans"
                                      display-currency="testDisplayCurrency"
                                      selected-rate-plan-type="testSelectedRatePlanType">
                    </rate-plan-select>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).RatePlanSelectController;

            (<any>directiveController).ratePlanChangedHandler = sinon.stub();
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('rate-plan-select-directive')).to.be.true;

            expect(directiveController.ratePlans).to.deep.equal(ratePlans);
            expect(directiveController.displayCurrency).to.deep.equal(displayCurrency);
            expect(directiveController.selectedRatePlanType).to.deep.equal(selectedRatePlanType);

        });

    });

    describe('Utility', () => {

        it('should be able to select a rate plan', () => {

            let ratePlan = ProgramRatePlanMock.entity();

            directiveController.selectRatePlan(ratePlan);

            expect(directiveController.selectedRatePlan).to.equal(ratePlan);

            expect((<any>directiveController).ratePlanChangedHandler).to.be.called;

        });

        it('should be able to determine if a rate plan is selected or not', () => {

            let ratePlan = ProgramRatePlanMock.entity();

            directiveController.selectedRatePlan = null;

            expect(directiveController.isSelected(ratePlan)).to.be.false;

            directiveController.selectedRatePlan = ProgramRatePlanMock.entity();

            expect(directiveController.isSelected(ratePlan)).to.be.false;

            directiveController.selectedRatePlan = ratePlan;

            expect(directiveController.isSelected(ratePlan)).to.be.true;

        });

    });

});

