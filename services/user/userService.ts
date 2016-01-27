import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService, {Paginator} from "../pagination/paginationService";
import {NgJwtAuthService} from "angular-jwt-auth";
import RegionService from "../region/regionService";
import User from "../../models/user/userModel";
import {IUserData} from "../auth/authService";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import UserProfile from "../../models/user/userProfileModel";
import UserCredential from "../../models/user/userCredentialModel";
import Role from "../../models/role/roleModel";
import MealPlan from "../../models/mealPlan/mealPlanModel";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";
import Cycle from "../../models/cycle/cycleModel";
import ZuoraInvoice from "../../models/zuoraInvoice/zuoraInvoiceModel";
import ZuoraPaymentMethod from "../../models/zuoraPaymentMethod/zuoraPaymentMethodModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import Program from "../../models/program/programModel";
import {namespace as resetPasswordDialog} from "../../../app/guest/login/resetPasswordDialog/resetPasswordDialog";

export interface IPurchaseRequestUser {
    email:string;
    firstName:string;
    lastName:string;
    userId:string;
    country:string;
    state:string;
}

export interface IPurchaseRequest {
    userId:string;
    programKey:string;
    programCycleId:string;
    mealPlanId:string;
    promoCode:string;
    zProductRatePlanId:string;
    zCurrency:string;
    zPaymentMethodId:string;
    _user:IPurchaseRequestUser;
}

export const namespace = 'common.services.user';

export default class UserService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'ngJwtAuthService', '$mdDialog', 'regionService', '$log'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                private ngJwtAuthService:NgJwtAuthService,
                private $mdDialog:ng.material.IDialogService,
                private regionService:RegionService,
                private $log:ng.ILogService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Article given data
     * @param data
     * @returns {Article}
     * @param exists
     */
    public modelFactory(data:any, exists:boolean = false):User {
        return new User(data, exists);
    }

    public newUser(data:any = {}):User {

        data = _.merge({
            userId: this.ngRestAdapter.uuid()
        }, data);

        return this.modelFactory(data);
    }

    public newUserCredential(user:User, exists:boolean = false):UserCredential {

        return new UserCredential({
            userId: user.userId
        }, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint(user?:User):string {
        if (user) {
            return '/users/' + user.getKey();
        }
        return '/users';
    }

    /**
     * Get the users paginator
     * @returns {Paginator}
     */
    public getUsersPaginator():Paginator {

        return this.getPaginator();
    }

    /**
     * Register a user
     * @param userData
     * @returns {IPromise<User>}
     */
    private register(userData:IUserData):ng.IPromise<IUserData> {

        let user = new User(userData);

        return this.ngRestAdapter.post(this.apiEndpoint() + '/' + user.userId, user.getAttributes())
            .then(() => this.ngRestAdapter.put(this.apiEndpoint() + '/' + user.userId + '/credentials', user._userCredential.getAttributes()))
            .then(() => {
                user._userCredential.updatedAt = moment();
                (<IChangeAwareDecorator>user).resetChanged();
                user.setExists(true);
                return user;
            }); //return this user object
    }

    /**
     * Register and log in a user
     * @param email
     * @param username
     * @param password
     * @param firstName
     * @param lastName
     * @returns {IPromise<TResult>}
     */
    public registerAndLogin(email:string, username:string, password:string, firstName:string, lastName:string):ng.IPromise<any> {

        let userId = this.ngRestAdapter.uuid();
        let userData:IUserData = {
            userId: userId,
            email: email,
            username: username,
            firstName: firstName,
            lastName: lastName,
            _userCredential: {
                userId: userId,
                password: password,
            }
        };

        return this.register(userData)
            .then((user:User) => {
                return this.ngJwtAuthService.authenticateCredentials(user.email, user._userCredential.password);
            })
            ;

    }

    /**
     * Brings up the reset password dialog
     */
    public promptResetPassword(email:string = undefined):void {
        this.$mdDialog.show({
            template: require('../../../app/guest/login/resetPasswordDialog/resetPasswordDialog.tpl.html'),
            controller: resetPasswordDialog + '.controller',
            controllerAs: 'ResetPasswordDialogController',
            clickOutsideToClose: false,
            escapeToClose: false,
            locals: {
                defaultEmail: email
            }
        });
    }

    /**
     * Reset a password for a user
     * @param email
     */
    public resetPassword(email:string):ng.IPromise<any> {
        return this.ngRestAdapter
            .skipInterceptor()
            .remove(`${this.apiEndpoint()}/${email}/password`);
    }

    /**
     * Confirm email update for a user
     * @param user
     * @param emailConfirmToken
     * @returns {ng.IHttpPromise<any>}
     */
    public confirmEmail(user:User, emailConfirmToken:string):ng.IPromise<any> {
        user.emailConfirmed = moment().toISOString();
        return this.ngRestAdapter
            .skipInterceptor((rejection:ng.IHttpPromiseCallbackArg<any>) => rejection.status == 422)
            .patch(`${this.apiEndpoint()}/${user.userId}`, _.pick(user, 'emailConfirmed'), {'email-confirm-token': emailConfirmToken});
    }

    /**
     * Send request to update all user information
     * @param user
     * @returns {ng.IHttpPromise<any>}
     */
    public saveUser(user:User):ng.IPromise<User|boolean> {

        let changes:any = (<IChangeAwareDecorator>user).getChanged();

        if (_.isEmpty(changes)) {
            return this.$q.when(false);
        }

        if (_.has(changes, 'regionCode')) {
            this.regionService.setRegion(this.regionService.getRegionByCode(changes.regionCode));
        }

        return this.ngRestAdapter
            .patch(this.apiEndpoint() + '/' + user.userId, changes)
            .then(() => user);
    }

    /**
     * Save user with all related entities
     * @param user
     * @returns {IPromise<User>}
     */
    public saveUserWithRelated(user:User):ng.IPromise<User> {

        return this.saveUser(user)
            .then(() => this.saveRelatedEntities(user))
            .then(() => {
                (<IChangeAwareDecorator>user).resetChanged(); //reset so next save only saves the changed items
                return user;
            });

    }

    /**
     * Save all related entities within user
     * @param user
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(user:User):ng.IPromise<any[]> {

        return this.$q.all([ //save all related entities
            this.saveUserProfile(user),
            this.saveUserCredentials(user),
        ]);

    }

    /**
     * Save user profile
     * @param user
     * @returns {any}
     */
    private saveUserProfile(user:User):ng.IPromise<UserProfile|boolean> {

        if (!user._userProfile) {
            return this.$q.when(false);
        }

        let method:string = 'put';
        let data = user._userProfile.getAttributes();

        if (user._userProfile.exists()) {
            method = 'patch';
            data = (<IChangeAwareDecorator>user._userProfile).getChanged();
            if (_.isEmpty(data)) {
                return this.$q.when(false);
            }
        }

        return this.ngRestAdapter[method](`${this.apiEndpoint()}/${user.userId}/profile`, data)
            .then(() => {
                user._userProfile.setExists(true);
                return user._userProfile;
            });

    }

    /**
     * Save user credentials
     * @param user
     * @returns {any}
     */
    private saveUserCredentials(user:User):ng.IPromise<UserCredential|boolean> {

        if (!user._userCredential) {
            return this.$q.when(false);
        }

        let method:string = 'put';
        let data = user._userCredential.getAttributes();

        if (user._userCredential.exists()) {
            method = 'patch';
            data = (<IChangeAwareDecorator>user._userCredential).getChanged();
            if (_.isEmpty(data)) {
                return this.$q.when(false);
            }
        }

        return this.ngRestAdapter[method](`${this.apiEndpoint(user)}/credentials`, data)
            .then(() => {
                user._userCredential.setExists(true);
                return user._userCredential;
            });

    }

    /**
     * Save roles for user
     * @param user
     * @returns {IPromise<User>}
     */
    public saveUserRoles(user:User):ng.IPromise<User> {

        let roleData = _.map(user._roles, (role:Role) => {
            return _.pick(role, 'key');
        });

        let flattenedRoles = _.map<Object, string>(roleData, 'key');

        if (_.xor(flattenedRoles, user.roles).length === 0) {
            return this.$q.when(user);
        }

        return this.ngRestAdapter.put(`${this.apiEndpoint(user)}/roles`, roleData).then(() => {
            user.roles = flattenedRoles;
            (<IChangeAwareDecorator>user).resetChanged();
            return user;
        });
    }

    /**
     * Get the auth user
     * @returns {User}
     */
    public getAuthUser():User {
        return <User>this.ngJwtAuthService.getUser();
    }

    /**
     * Purchase a program.
     *
     * @param user
     * @param program
     * @param selectedCycle
     * @param selectedRatePlan
     * @param selectedCurrency
     * @param selectedMealPlan
     * @param paymentRefId
     * @param promoCode
     * @returns {IPromise<TResult>}
     */
    public purchaseProgram(user:User,
                           program:Program,
                           selectedCycle:Cycle,
                           selectedRatePlan:ProgramRatePlan,
                           selectedCurrency:string,
                           selectedMealPlan:MealPlan,
                           paymentRefId:string,
                           promoCode:string):ng.IPromise<any> {

        let request:IPurchaseRequest = {
            programCycleId: selectedCycle.getKey(),
            programKey: program.programKey,
            userId: user.getKey(),
            zPaymentMethodId: paymentRefId,
            zProductRatePlanId: selectedRatePlan.ratePlanId,
            zCurrency: selectedCurrency,
            mealPlanId: selectedMealPlan.getKey(),
            promoCode: promoCode,
            _user: <IPurchaseRequestUser>{
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userId: user.getKey(),
                state: user.state,
                country: user.country
            }
        };

        return this.ngRestAdapter.skipInterceptor()
            .post(this.apiEndpoint(user) + '/purchases', request)
            .catch((res) => {
                if (res.status == 409) {
                    return this.$q.reject(new Error(res.data.message + ' Please log in or use a different email address to continue.'));
                }

                let errorMessage:string = '';
                if (res.data && res.data.message) {
                    errorMessage = ' ' + res.data.message;
                }

                this.$log.error('Checkout Error', errorMessage, request);

                return this.$q.reject(new Error(errorMessage));
            })

    }

    /**
     * Update user's payment method.
     *
     * @param user
     * @param paymentRefId
     * @returns {ng.IHttpPromise<ZuoraPaymentPage.Response>}
     */
    public updatePaymentMethod(user:User,
                               paymentRefId:string):ng.IPromise<ZuoraPaymentPage.Response> {

        return this.ngRestAdapter.put(this.apiEndpoint(user) + '/payment-method/' + paymentRefId, null);

    }

    /**
     * Get a user's invoices.
     *
     * @param user
     * @returns {IPromise<ZuoraInvoice>[]}
     */
    public getInvoices(user:User):ng.IPromise<ZuoraInvoice[]> {

        return this.ngRestAdapter.skipInterceptor()
            .get(this.apiEndpoint(user) + '/invoices')
            .then((res) => _.map(res.data, (invoiceData) => {
                return new ZuoraInvoice(invoiceData);
            }))
            .catch(() => []); // Return empty array if no Zuora account
    }

    /**
     * Get a user's invoice.
     */
    public getInvoicePdfLink(user:User, invoice:ZuoraInvoice):string {
        return this.apiEndpoint(user) + '/invoices/' + invoice.Id + '/pdf';
    }

    public getInvoicePdfArrayBuffer(user:User, invoice:ZuoraInvoice):ng.IPromise<ArrayBuffer> {

        return this.ngRestAdapter
            .skipInterceptor()
            .get(this.getInvoicePdfLink(user, invoice), null, {responseType: 'arraybuffer'})
            .then((res):ArrayBuffer => res.data);
    }

    /**
     * Get a user's payment method.
     *
     * @param user
     * @returns {IPromise<ZuoraPayment>}
     */
    public getPaymentMethod(user:User):ng.IPromise<ZuoraPaymentMethod> {

        return this.ngRestAdapter.skipInterceptor()
            .get(this.apiEndpoint(user) + '/payment-method')
            .then((res) => {
                return new ZuoraPaymentMethod(res.data);
            })
            .catch(() => null); // Return null if no Zuora account

    }

    /**
     * Update user's meal plan choice
     * users/{id}/meal-plans/{fromId}/replace-with/{toId}
     *
     * @param user
     * @param fromMealPlan
     * @param toMealPlan
     * @returns {ng.IPromise<MealPlan>}
     */
    public updateMealPlan(user:User,
                          fromMealPlan:MealPlan,
                          toMealPlan:MealPlan):ng.IPromise<MealPlan> {

        return this.ngRestAdapter.put(this.apiEndpoint(user) + '/meal-plans/' + fromMealPlan.getKey() + '/replace-with/' + toMealPlan.getKey(), null)
            .then(() => toMealPlan);
    }

    /**
     * Create a user in admin with the intention of editing through edit profile
     */
    public adminCreateUser(email:string):ng.IPromise<string> {

        let userId = this.ngRestAdapter.uuid();
        let userData:IUserData = {
            userId: userId,
            email: email,
            username: email,
            _userCredential: {
                userId: userId,
                password: Math.random().toString(20),
            }
        };

        return this.register(userData)
            .then((user) => user.userId);
    }

}

angular.module(namespace, [])
    .service('userService', UserService);





