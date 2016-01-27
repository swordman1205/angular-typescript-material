import {AbstractModel} from "../abstractModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
@changeAware
export default class Direction extends AbstractModel {

    protected __primaryKey = 'directionId';

    public directionId:string;
    public recipeId:string;
    public groupId:string;
    public numbered:boolean;
    public content:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}
