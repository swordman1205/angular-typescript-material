import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel} from "../abstractModel";
@changeAware
export default class DietaryRestriction extends AbstractModel {

    public static allergenType = 'allergen';
    public static dietType = 'diet';

    public name:string;
    public type:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

