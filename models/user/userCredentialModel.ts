import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, IAttributeCastMap} from "../abstractModel";
import {IUserCredential} from "../../services/auth/authService";

@changeAware
export default class UserCredential extends AbstractModel implements IUserCredential {

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public userId:string;
    public password:string;
    public updatedAt:moment.Moment;
    public createdAt:moment.Moment;

    constructor(data:any, exists:boolean = false) {

        super(data, exists);

        this.hydrate(data, exists);
    }

}

