import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel} from "../abstractModel";
@changeAware
export default class Image extends AbstractModel {

    protected __primaryKey = 'imageId';

    public imageId:string;
    public version:number;
    public folder:string;
    public format:string;
    public alt:string;
    public title:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}




