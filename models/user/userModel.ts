import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import {IUserData} from "../../services/auth/authService";
import UserSocialLogin from "./userSocialLoginModel";
import UserCredential from "./userCredentialModel";
import Role from "../role/roleModel";
import MealPlan from "../mealPlan/mealPlanModel";
import Article from "../post/article/articleModel";
import UserProfile from "./userProfileModel";
import Image from "../image/imageModel";

export const PAYMENT_STATUS_EXPIRED:PaymentStatuses = 'expired';
export const PAYMENT_STATUS_EXPIRES_SOON:PaymentStatuses = 'expires_soon';
export const PAYMENT_STATUS_PAYMENT_DECLINED:PaymentStatuses = 'payment_declined';
export const PAYMENT_STATUS_PAYMENT_FATAL:PaymentStatuses = 'payment_fatal';

export type PaymentStatuses = 'expired' | 'expires_soon' | 'payment_declined' | 'payment_fatal';

@changeAware
export default class User extends AbstractModel implements IUserData {

    protected __nestedEntityMap:INestedEntityMap = {
        _userProfile: UserProfile,
        _socialLogins: UserSocialLogin,
        _userCredential: UserCredential,
        _roles: Role,
        _purchasedMealPlans: MealPlan,
        _activePurchasedMealPlans: MealPlan,
        _purchasedMealPlansHistory: MealPlan,
        _availableMealPlans: MealPlan,
        _authoredArticles: Article
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    protected __primaryKey = 'userId';

    public userId:string;
    public email:string;
    public username:string;
    public firstName:string;
    public lastName:string;
    public emailConfirmed:string;
    public country:string;
    public state:string;
    public regionCode:string;
    public avatarImgUrl:string;
    public avatarImgId:string;
    public timezoneIdentifier:string;
    public zuoraAccountId:string;
    public zuoraCurrency:string;
    public paymentMethodStatus:PaymentStatuses;
    public _userCredential:UserCredential;
    public _userProfile:UserProfile;
    public _socialLogins:UserSocialLogin[] = [];
    public _roles:Role[] = [];
    public roles:string[] = []; // list of role keys, supplied in token
    public _uploadedAvatar:Image;
    public _purchasedMealPlans:MealPlan[] = []; // all purchased meal plans
    public _activePurchasedMealPlans:MealPlan[] = []; // status = active
    public _purchasedMealPlansHistory:MealPlan[] = []; // status = active OR status = cancelled
    public _availableMealPlans:MealPlan[] = []; // status = active && access_until > now
    public _authoredArticles:Article[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);

        if (this._roles && this._roles.length > 0) {
            this.roles = _.map<Role, string>(this._roles, 'key');
        }
    }

    /**
     * Getter for the user's full name
     * @returns {string}
     */
    get fullName():string {
        return _.filter([this.firstName, this.lastName], _.identity).join(' ');
    }

    /**
     * Check if the user is an administrator
     * @returns {boolean}
     */
    public isAdmin():boolean {

        return _.includes(this.roles, Role.adminRoleKey);
    }

    /**
     * Checks to see if the user has a social login
     * @returns {boolean}
     */
    public hasSocialLogin(provider:string):boolean {
        return _.some(this._socialLogins, ['provider', provider]);
    }

    /**
     * Get comma separated display value for user's roles
     * @returns {any}
     */
    public rolesDisplay():string {

        return _.map(this.roles, (role:string) => {
            return _.startCase(_.words(role).join(' '));
        }).join(', ');

    }

}




