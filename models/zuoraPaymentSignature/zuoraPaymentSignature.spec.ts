import {expect} from "../../../testBootstrap.spec";
import ZuoraPaymentSignature from "./zuoraPaymentSignature";
describe('Zuora Payment Signature Model', () => {

    it('should instantiate a new Zuora payment signature', () => {

        let zuoraPaymentSignature = new ZuoraPaymentSignature({});

        expect(zuoraPaymentSignature).to.be.instanceOf(ZuoraPaymentSignature);

    });

});

