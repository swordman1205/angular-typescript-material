import {AbstractModel} from "../abstractModel";
import User from "../user/userModel";
import {Config} from "../../../config.ts";
export default class ZuoraPaymentSignature extends AbstractModel {

    protected __primaryKey = 'key';

    public key:string;
    public signature:string;
    public token:string;
    public tenantId:string;
    public success:boolean;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public getPaymentPageParameters(paymentGateway:string, user?:User):ZuoraPaymentPage.IPaymentPageParameters {

        let paymentPageParameters = <ZuoraPaymentPage.IPaymentPageParameters> {
            tenantId: this.tenantId,
            id: Config.get('ZUORA_PAYMENT_PAGE_ID'),
            token: this.token,
            signature: this.signature,
            style: 'inline',
            key: this.key,
            submitEnabled: 'true',
            locale: 'en_AU',
            url: Config.get('ZUORA_ADMIN_BASE_URL') + 'apps/PublicHostedPageLite.do',
            paymentGateway: paymentGateway,
        };

        if (user && user.zuoraAccountId) {
            paymentPageParameters.field_accountId = user.zuoraAccountId;
        }

        return paymentPageParameters;

    }

}




