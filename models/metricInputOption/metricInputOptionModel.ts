import {AbstractModel} from "../abstractModel";
export default class MetricInputOption extends AbstractModel {
    public group:string;
    public options:string[];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }
}

