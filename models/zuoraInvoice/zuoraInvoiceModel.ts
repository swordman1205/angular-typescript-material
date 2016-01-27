import {AbstractModel, IAttributeCastMap} from "../abstractModel";
export default class ZuoraInvoice extends AbstractModel {

    protected __primaryKey = 'Id';

    protected __attributeCastMap:IAttributeCastMap = {
        CreatedDate: this.castMoment,
        DueDate: this.castMomentDate,
        InvoiceDate: this.castMomentDate,
        PostedDate: this.castMoment,
        TargetDate: this.castMomentDate,
        UpdatedDate: this.castMoment
    };

    public Id:string;
    public AccountId:string;
    public AdjustmentAmount:number;
    public Amount:number;
    public AmountWithoutTax:number;
    public Balance:number;
    public CreatedById:string;
    public CreatedDate:moment.Moment;
    public CreditBalanceAdjustmentAmount:number;
    public DueDate:momentExtended.MomentDate;
    public IncludesOneTime:boolean;
    public IncludesRecurring:boolean;
    public IncludesUsage:boolean;
    public InvoiceDate:momentExtended.MomentDate;
    public InvoiceNumber:string;
    public PaymentAmount:number;
    public PostedBy:string;
    public PostedDate:moment.Moment;
    public RefundAmount:number;
    public Status:string;
    public TargetDate:momentExtended.MomentDate;
    public TaxAmount:number;
    public TaxExemptAmount:number;
    public UpdatedDate:moment.Moment;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

