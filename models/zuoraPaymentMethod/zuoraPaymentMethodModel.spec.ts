import {expect} from "../../../testBootstrap.spec";
import ZuoraPaymentMethod from "./zuoraPaymentMethodModel";
describe('Zuora Payment Method Model', () => {

    it('should instantiate a new Zuora payment method', () => {

        let paymentMethod = new ZuoraPaymentMethod({});

        expect(paymentMethod).to.be.instanceOf(ZuoraPaymentMethod);

    });

});

