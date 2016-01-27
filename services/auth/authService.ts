import * as angular from "angular";
import * as _ from "lodash";
import {IUser, IJwtClaims, NgJwtAuthService, ICredentials} from "angular-jwt-auth";
import User from "../../models/user/userModel";
import NotificationService from "../notification/notificationService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {namespace as loginDialog} from "../../../app/guest/login/loginDialog/loginDialog";

export interface IUserCredential {
    userId:string;
    password:string;
}

export interface ISocialLogin {
    userId:string;
    provider:string;
    token:string;
}

export interface IUserData extends IUser {
    _self?:string;
    userId:string;
    username:string;
    firstName?:string;
    lastName?:string;
    emailConfirmed?:string;
    avatarImgUrl?:string;
    country?:string;
    regionCode?:string;
    _userCredential?:IUserCredential;
    _socialLogins?:ISocialLogin[];
}

export interface JwtAuthClaims extends IJwtClaims {
    _user:IUserData;
}

export const namespace = 'common.services.auth';

export interface IImpersonationObject {
    originalUser:User;
    originalUserToken:string;
    impersonatedUser:User;
}

export default class AuthService {

    public static impersonationStorageKey = 'impersonation';
    public impersonation:IImpersonationObject = null;
    public initialisedPromise:ng.IPromise<any>;

    static $inject:string[] = ['ngJwtAuthService', '$q', '$location', '$timeout', '$mdDialog', '$state', 'notificationService', '$window', 'ngRestAdapter', '$analytics'];

    constructor(private ngJwtAuthService:NgJwtAuthService,
                private $q:ng.IQService,
                private $location:ng.ILocationService,
                private $timeout:ng.ITimeoutService,
                private $mdDialog:ng.material.IDialogService,
                private $state:ng.ui.IStateService,
                private notificationService:NotificationService,
                private $window:ng.IWindowService,
                private ngRestAdapter:NgRestAdapterService,
                private $analytics:angulartics.IAnalyticsService) {

        this.loadStoredImpersonation();

        this.initialisedPromise = this.initialiseJwtAuthService().finally(() => {

            return this.$q.all([
                this.processQueryToken(),
                this.processLoginToken()
            ]);

        }).catch((e) => {
            console.error("Auth Initialisation failed: ", e);
        });

    }

    public loadStoredImpersonation() {
        let storedImpersonation:IImpersonationObject = angular.fromJson(this.$window.localStorage.getItem(AuthService.impersonationStorageKey));

        if (storedImpersonation) {
            storedImpersonation.originalUser = new User(storedImpersonation.originalUser);
            storedImpersonation.impersonatedUser = new User(storedImpersonation.impersonatedUser);
            this.impersonation = storedImpersonation;
        }
    }

    /**
     * Initialise the NgJwtAuthService
     * @returns {ng.IPromise<any>}
     */
    private initialiseJwtAuthService() {

        this.ngJwtAuthService.registerLoginListener((user:User) => {
            this.$analytics.setUsername(user.getKey());
        });

        return this.ngJwtAuthService
            .registerUserFactory((subClaim:string, tokenData:JwtAuthClaims):ng.IPromise<User> => {
                return this.$q.when(new User(tokenData._user, true));
            })
            .registerLoginPromptFactory((deferredCredentials:ng.IDeferred<ICredentials>, loginSuccessPromise:ng.IPromise<IUser>, currentUser:IUser):ng.IPromise<any> => {

                // We need to process tokens here in case we have arrived back here from
                // after a social login. See QSN-1243.
                return this.$q.all([
                        this.processQueryToken(),
                        this.processLoginToken()
                    ])
                    .then(() => {
                        if (!this.ngJwtAuthService.loggedIn) {

                            let dialogConfig:ng.material.IDialogOptions = {
                                template: require('../../../app/guest/login/loginDialog/loginDialog.tpl.html'),
                                controller: loginDialog + '.controller',
                                controllerAs: 'LoginDialogController',
                                clickOutsideToClose: false,
                                locals: {
                                    deferredCredentials: deferredCredentials,
                                    loginSuccess: {
                                        promise: loginSuccessPromise //nest the promise in a function as otherwise material will try to wait for it to resolve
                                    },
                                },
                                escapeToClose: false
                            };

                            return this.$timeout(_.noop) //first do an empty timeout to allow the controllers to init if login prompt is fired from within a .run() phase
                                .then(() => this.$mdDialog.show(dialogConfig));
                        }

                        return this.$q.when(true);
                    })
                    .catch((e) => {
                        console.error("Auth Initialisation failed: ", e);
                    });

            })
            .init() //initialise the auth service (kicks off the timers etc)
            .catch((err) => {
                if (err === false) { //if the error was user failed to authenticate | @todo make the auth service throw a better error
                    return true;
                }
                return err;
            });

    }

    /**
     * Login using a social network
     * @param type
     */
    public socialLogin(type:string):void {

        let url = '/auth/social/' + type + '?returnUrl=';
        let encodedParam = this.$location.path();

        _.forEach(this.$location.search(), (value:string, key:string) => {
            encodedParam += '?' + key + '=' + value;
        });

        this.$window.location.href = url + (<any>this.$window).encodeURIComponent(encodedParam);

    }

    /**
     * Unlink a social login from a user
     * @param user
     * @param provider
     * @returns {ng.IHttpPromise<any>}
     */
    public unlinkSocialLogin(user:User, provider:string):ng.IPromise<any> {
        return this.ngRestAdapter
            .remove('/users/' + user.userId + '/socialLogin/' + provider);
    }

    /**
     * Check the address bar for a new jwt token to process
     * @returns {any}
     */
    private processQueryToken():ng.IPromise<any> {

        this.removeFacebookHash();

        let jwtAuthToken:string = this.getJwtAuthToken();

        if (jwtAuthToken) {

            let queryTokenPromise = this.ngJwtAuthService.processNewToken(jwtAuthToken);

            return queryTokenPromise;
        }

        return this.$q.when(true); //immediately resolve

    }

    private getJwtAuthToken():string {
        let token:string = null;

        _.some(this.$location.search(), (value:string, key:string) => {
            if (key == 'jwtAuthToken') {
                this.$location.search('jwtAuthToken', null);
                token = value;
                return true;
            }
            else if (value.indexOf('?jwtAuthToken=') > -1) {
                let paramParts:string[] = value.split('?jwtAuthToken=');
                this.$location.search(key, paramParts[0]);
                token = paramParts[1];
                return true;
            }
        });

        return token;
    }

    /**
     * Removes the facebook return hash `#_=_`
     */
    private removeFacebookHash():void {

        if (this.$location.hash() == '_=_') {
            this.$location.hash('');
        }

    }

    /**
     * Check the url for password reset token and process it
     * @returns {any}
     */
    private processLoginToken():ng.IPromise<any> {

        let queryParams = this.$location.search();
        if (_.isEmpty(queryParams.loginToken)) {
            return this.$q.when(true); //immediately resolve
        }

        let token = queryParams.loginToken;

        /**
         * We do not remove the loginToken from the URL params at this point because that would cause a state
         * reload causing whichever state we're navigating to to fully load twice (all resolves are called again);
         * this results in unneeded XHRs. The loginToken is safely removed in the constructor of
         * ProfileController, this means that the state we navigate to when we use the loginToken will always be
         * profile. See profile.ts.
         */

        return this.ngJwtAuthService.exchangeToken(token)
            .catch((err) => {
                this.$mdDialog.show(this.$mdDialog.alert()
                    .clickOutsideToClose(false)
                    .escapeToClose(true)
                    .title('Login')
                    .textContent('Sorry, you have already tried to log in using this link')
                    .ok('Ok')
                    .ariaLabel('Login')
                );
            });
    }

    public impersonateUser(user:User):ng.IPromise<User> {

        let userIdentifier = user.userId;
        let currentUser = this.ngJwtAuthService.getUser();

        this.impersonation = {
            originalUser: <User>currentUser,
            originalUserToken: this.ngJwtAuthService.rawToken,
            impersonatedUser: user
        };

        this.$window.localStorage.setItem(AuthService.impersonationStorageKey, angular.toJson(this.impersonation));

        return this.ngJwtAuthService.loginAsUser(userIdentifier);
    }

    public restoreFromImpersonation():ng.IPromise<any> {

        if (!this.impersonation) {
            return this.$q.reject("No stashed token to restore");
        }

        return this.ngJwtAuthService.processNewToken(this.impersonation.originalUserToken).then(() => {
            this.impersonation = null;
            this.$window.localStorage.removeItem(AuthService.impersonationStorageKey);
            this.$state.reload();
            return this.ngJwtAuthService.refreshToken();
        });
    }

}

angular.module(namespace, [])
    .service('authService', AuthService);





