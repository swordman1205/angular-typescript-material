import {AbstractModel} from "../abstractModel";

export default class SystemInformation extends AbstractModel {

    public spiraLoadbalancerVersion:string;
    public spiraAppVersion:string;
    public spiraApiVersion:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}




