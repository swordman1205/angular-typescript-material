import {AbstractModel} from "../abstractModel";
import {ISocialLogin} from "../../services/auth/authService";

export type TSocialLoginProvider = 'google' | 'facebook';
export default class UserSocialLogin extends AbstractModel implements ISocialLogin {

    protected __primaryKey = 'userId';

    public static googleType:TSocialLoginProvider = 'google';
    public static facebookType:TSocialLoginProvider = 'facebook';
    public static providerTypes:TSocialLoginProvider[] = [UserSocialLogin.googleType, UserSocialLogin.facebookType];

    public userId:string;
    public provider:string;
    public token:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

