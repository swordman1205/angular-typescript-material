import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {RatePlanDisplayController} from "./ratePlanDisplay";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";
import ProgramRatePlanMock from "../../models/programRatePlan/programRatePlan.mock";
import ProgramRatePlanCurrencyAmountMock from "../../models/programRatePlan/programRatePlan.mock";

interface TestScope extends ng.IRootScopeService {
    RatePlanDisplayController:RatePlanDisplayController;
    testRatePlan:ProgramRatePlan;
    testDisplayCurrency:string;
    testIsSelected:boolean;
}

describe('Rate Plan Display Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:RatePlanDisplayController;

    // Mocks
    let ratePlan = ProgramRatePlanMock.entity({
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
        displayCurrency:string = 'AUD';

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testRatePlan = ratePlan;
            directiveScope.testDisplayCurrency = displayCurrency;
            directiveScope.testIsSelected = true;

            let element = angular.element(`
                    <rate-plan-display rate-plan="testRatePlan"
                                       display-currency="testDisplayCurrency"
                                       is-selected="testIsSelected">
                    </rate-plan-display>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).RatePlanDisplayController;
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('rate-plan-display-directive')).to.be.true;

            expect($(compiledElement).hasClass('selected')).to.be.true;

            expect(_.trim($($($(compiledElement).find('md-checkbox')[0]).find('span')[0]).html())).to.equal('PLAN SELECTED');

            expect(directiveController.ratePlan).to.deep.equal(ratePlan);

            expect(directiveController.displayCurrency).to.deep.equal(displayCurrency);

        });

    });

});

