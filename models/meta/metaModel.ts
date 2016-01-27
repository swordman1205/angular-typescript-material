import {AbstractModel} from "../abstractModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
@changeAware
export default class Meta extends AbstractModel {

    protected __primaryKey:string = 'metaId';

    public metaId:string;
    public metaableId:string;
    public metaableType:string;
    public metaName:string;
    public metaContent:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}


