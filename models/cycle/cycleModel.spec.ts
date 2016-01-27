import {expect} from "../../../testBootstrap.spec";
import Cycle from "./cycleModel";
import CycleMock from "./cycleModel.mock";
import momentDate from "../../libs/moment/momentDate";
describe('Cycle Model', () => {

    it('should instantiate a new cycle', () => {

        let cycle = new Cycle({});

        expect(cycle).to.be.instanceOf(Cycle);

    });

    it('should be able to get period info', () => {

        let preSeasonInfo = {
            index: -1,
            name: 'foobar',
            info: null
        };

        let cycle = new Cycle({
            periodInfo: [preSeasonInfo, {
                index: 0,
                name: 'barfoo',
                info: null
            }]
        });

        expect(cycle.getPeriodInfo(-1)).to.deep.equal(preSeasonInfo);

        expect(cycle.getPeriodInfo(2)).to.equal(undefined);

        let fallback = {
            index: 2,
            name: 'bar',
            info: 'hello'
        };

        expect(cycle.getPeriodInfo(2, fallback)).to.deep.equal(fallback);

    });

    it('should be able to get the first day of sale', () => {

        let today = momentDate();

        let cycle = CycleMock.entity({
            scheduleOnSaleStart: today.clone(),
            scheduleOnSalePreSaleDays: 7
        });

        expect(cycle.getFirstDayOfSale()).to.deep.equal(today.clone().subtract(7, 'days'));

    });

    it('should be able to get the last day of sale', () => {

        let today = momentDate();

        let cycle = CycleMock.entity({
            scheduleOnSaleEnd: today.clone(),
            scheduleOnSalePostSaleDays: 7
        });

        expect(cycle.getLastDayOfSale()).to.deep.equal(today.clone().add(7, 'days'));

    });

    it('should be able to get the first program access day', () => {

        let today = momentDate();

        let cycle = CycleMock.entity({
            periodOneStartDate: today.clone(),
            mealPeriodEarlyAccessDays: 3
        });

        expect(cycle.getFirstProgramAccessDay()).to.deep.equal(today.clone().subtract(3, 'days'));

    });

});


