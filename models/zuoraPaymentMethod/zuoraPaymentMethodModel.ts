import {AbstractModel} from "../abstractModel";
export default class ZuoraPaymentMethod extends AbstractModel {

    protected __primaryKey = 'Id';

    public Id:string;
    public CreditCardExpirationMonth:number;
    public CreditCardExpirationYear:number;
    public CreditCardHolderName:string;
    public CreditCardMaskNumber:string;
    public CreditCardType:string;
    public PaymentMethodStatus:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

