import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel} from "../abstractModel";

@changeAware
export default class Localization<T extends AbstractModel> extends AbstractModel {

    protected __primaryKey = 'localizableId';

    public localizableId:string;
    public localizableType:string;
    public localizations:T;
    public excerpt:string;
    public title:string;
    public regionCode:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}




