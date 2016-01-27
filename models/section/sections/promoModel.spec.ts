import {expect} from "../../../../testBootstrap.spec";
import PromoMock from "./promoModel.mock";
import Promo from "./promoModel";
describe('Promo Model', () => {

    it('should instantiate a new promo', () => {

        let promoData = (new PromoMock).getMockData();

        let promo = new Promo(promoData);

        expect(promo).to.be.instanceOf(Promo);

    });

    it('should mock a section promo', () => {

        expect(PromoMock.entity()).to.be.instanceOf(Promo);
    });

});

