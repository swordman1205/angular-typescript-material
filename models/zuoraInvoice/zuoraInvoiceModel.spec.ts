import {expect} from "../../../testBootstrap.spec";
import ZuoraInvoice from "./zuoraInvoiceModel";
describe('Zuora Invoice Model', () => {

    it('should instantiate a new Zuora invoice', () => {

        let invoice = new ZuoraInvoice({});

        expect(invoice).to.be.instanceOf(ZuoraInvoice);

    });

});

