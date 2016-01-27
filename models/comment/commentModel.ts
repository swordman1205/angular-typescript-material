import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import User from "../user/userModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";

@changeAware
export default class Comment extends AbstractModel {

    protected __primaryKey = 'commentId';

    protected __nestedEntityMap:INestedEntityMap = {
        _author: User,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public postCommentId:number;
    public body:string;
    public createdAt:moment.Moment;
    public _author:User;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}