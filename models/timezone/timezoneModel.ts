import {AbstractModel, INestedEntityMap} from "../abstractModel";

export default class Timezone extends AbstractModel {

    public timezoneIdentifier:string;
    public offset:number;
    public isDst:boolean;
    public displayOffset:string;

}