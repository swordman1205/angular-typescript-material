import {expect} from "../../../testBootstrap.spec";
import ProgramRatePlan, {ProgramRatePlanCurrencyAmount} from "./programRatePlan";
import {ProgramRatePlanCurrencyAmountMock, default as ProgramRatePlanMock} from "./programRatePlan.mock";
describe('Rate Plan Model', () => {

    it('should instantiate a new rate plan', () => {

        let ratePlan = new ProgramRatePlan({});

        expect(ratePlan).to.be.instanceOf(ProgramRatePlan);

    });

    it('should be able to get currency amount', () => {

        let targetCurrencyAmount = ProgramRatePlanCurrencyAmountMock.entity({
            currency: 'AUD'
        });

        let ratePlan = ProgramRatePlanMock.entity({
            _currencyAmounts: [
                ProgramRatePlanCurrencyAmountMock.entity({
                    currency: 'GBP'
                }),
                targetCurrencyAmount,
                ProgramRatePlanCurrencyAmountMock.entity({
                    currency: 'USD'
                }),
            ]
        });

        expect(ratePlan.getCurrencyAmount('AUD')).to.deep.equal(targetCurrencyAmount);

    });

});

describe('Rate Plan Currency Amount Model', () => {

    it('should instantiate a new rate plan currency amount', () => {

        let ratePlanCurrencyAmount = new ProgramRatePlanCurrencyAmount({});

        expect(ratePlanCurrencyAmount).to.be.instanceOf(ProgramRatePlanCurrencyAmount);

    });

});

