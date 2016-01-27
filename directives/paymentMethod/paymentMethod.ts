import * as angular from "angular";
import * as _ from "lodash";
import User from "../../models/user/userModel";
import ZuoraPaymentMethod from "../../models/zuoraPaymentMethod/zuoraPaymentMethodModel";
import ZuoraPaymentSignature from "../../models/zuoraPaymentSignature/zuoraPaymentSignature";
import UserService from "../../services/user/userService";
import ZuoraService from "../../services/zuora/zuoraService";
import RegionService, {ISupportedRegion} from "../../services/region/regionService";

export const namespace = 'common.directives.paymentMethod';

export interface IPaymentMethodChangedHandler {
    (paymentMethod:ZuoraPaymentMethod):void;
}

export interface IDismissableErrorNotice {
    ():ng.IPromise<any>
}

export type TPaymentMethodStatus = 'standby' | 'loadingSignature' | 'loadingPortal' | 'userChanged' | 'awaitingInput' | 'processingPaymentMethod' | 'retrievingMethod' | 'saved' | 'error';

export class PaymentMethodController {

    public static awaitingInputStatus:TPaymentMethodStatus = 'awaitingInput';

    private paymentMethodChangedHandler:IPaymentMethodChangedHandler;

    public user:User;
    public paymentMethod:ZuoraPaymentMethod = null;
    public allowNew:boolean;
    public isUsingExistingPaymentMethod:boolean = false;
    public status:TPaymentMethodStatus;
    public statusLog:TPaymentMethodStatus[] = [];
    public scopeWatchDeregister:Function;
    public region:ISupportedRegion;

    static $inject = ['userService', 'zuoraService', '$scope', '$mdDialog', '$q', '$analytics'];

    constructor(private userService:UserService,
                private zuoraService:ZuoraService,
                private $scope:ng.IScope,
                private $mdDialog:ng.material.IDialogService,
                private $q:ng.IQService,
                private $analytics:angulartics.IAnalyticsService) {
        this.initialize();
    }

    /**
     * Set the status of the directive, used for unit testing and debugging errors
     * @param status
     * @returns {TPaymentMethodStatus[]}
     */
    private setStatus(status:TPaymentMethodStatus):TPaymentMethodStatus[] {
        this.status = status;
        this.statusLog.push(status);
        return this.statusLog;
    }

    /**
     * Clear all status logs
     */
    public clearPaymentStatusLog():void {
        this.statusLog = [];
    }

    /**
     * Initialize the directive
     */
    private initialize():void {

        // Watch for user change, and call userChanged() when both old and new are defined
        // and have changed
        this.scopeWatchDeregister = this.$scope.$watch(() => {
            if (!this.user){
                return undefined;
            }
            return this.user.getKey();
        }, (newUser:string, oldUser:string) => {
            if (newUser !== oldUser) {
                this.userChanged();
            }
        }, true);

        this.initializeUser();
        this.setStatus('standby');
    }

    /**
     * Called when a user is changed
     */
    public userChanged():void {
        this.setStatus('userChanged');
        this.initializeUser();
    };

    /**
     * Initialiase the user - if they currently have an existing zuora account, do nothing but show the change button,
     * otherwise initalise the form for a new user
     */
    private initializeUser():void {
        if (this.userExistsAndHasZuoraAccount()) {
            this.isUsingExistingPaymentMethod = true;
        } else {
            this.changePaymentMethod(); //render the frame for a new user
        }
    }

    /**
     * Helper function to check if user both exists and has a zuora account
     * @returns {User|boolean}
     */
    private userExistsAndHasZuoraAccount():boolean {
        return this.user && this.user.exists() && !!this.user.zuoraAccountId;
    };

    /**
     * Register change handler for when the ngModel value should change
     * @param handler
     */
    public registerPaymentRefIdChangedHandler(handler:IPaymentMethodChangedHandler):void {
        this.paymentMethodChangedHandler = handler;
    }

    /**
     * Cancel current input and revert to using the current payment method
     */
    public useExistingPaymentMethod():void {
        this.setStatus('standby');
        this.isUsingExistingPaymentMethod = true;
    }

    /**
     * Trigger change payment method process
     * 1. Get the signature for a new payment method
     * 2. Render the payment input field and await user input
     * 3. Clear the cached signature
     * 4. Notify the user
     */
    public changePaymentMethod() {

        this.isUsingExistingPaymentMethod = false;

        this.setStatus('loadingSignature');
        this.zuoraService.getPaymentPageSignature()
        .catch((res) => {
            return this.$q.reject(this.dismissableErrorNoticeFactory("Could not retrieve remote portal signature.", res));
        })
        .then((paymentSignature:ZuoraPaymentSignature) => {
            return this.promptAndHandleUserPaymentDetails(paymentSignature, this.userExistsAndHasZuoraAccount());

        })
        .then((paymentMethod:ZuoraPaymentMethod) => {
            this.zuoraService.clearCachedSignature(); //clear it so if another change is made a new signature is used

                //@TODO payment method details on the payment method
                this.paymentMethod = paymentMethod;
                this.paymentMethodChangedHandler(this.paymentMethod);
                this.isUsingExistingPaymentMethod = true;

            this.setStatus('saved');
            this.setStatus('standby');


        }).catch((notice:IDismissableErrorNotice) => {
            this.setStatus('error');
            if (_.isFunction(notice)){
                notice();
            }
        });
    }

    /**
     * @param paymentSignature
     * @param existing
     * @returns {IPromise<common.models.ZuoraPaymentMethod>}
     */
    private promptAndHandleUserPaymentDetails(paymentSignature:ZuoraPaymentSignature, existing:boolean):ng.IPromise<ZuoraPaymentMethod> {
        let paymentGateway = (this.region) ? this.region.paymentGateway : RegionService.defaultPaymentGateway;
        let paymentPageParameters = paymentSignature.getPaymentPageParameters(paymentGateway, this.user);
        let paymentMethodPromise = this.getUserPaymentDetails(paymentPageParameters);

        // if this is a new user, we just return the new method
        if (!existing){
            return paymentMethodPromise;
        }

        //if not, we save it to the user then immediately retrieve the saved object
        return paymentMethodPromise.then((paymentMethod:ZuoraPaymentMethod):ng.IPromise<ZuoraPaymentMethod> => {
            return this.userService.updatePaymentMethod(this.user, paymentMethod.getKey())
                .then(() => this.userService.getPaymentMethod(this.user))
                .catch((err) => this.$q.reject(this.dismissableErrorNoticeFactory("Your payment method was not changed successfully, please try again.", err)));
        });
    }

    /**
     * Library source: https://apisandboxstatic.zuora.com/Resources/libs/hosted/1.3.0/zuora.js
     * @param paymentPageParameters
     * @returns {IPromise<ZuoraPaymentMethod>}
     */
    private getUserPaymentDetails(paymentPageParameters:ZuoraPaymentPage.IPaymentPageParameters):ng.IPromise<ZuoraPaymentMethod> {

        this.setStatus('loadingPortal');

        return this.zuoraService.getZuoraPaymentPage()
            .catch((error) => {
                return this.$q.reject(this.dismissableErrorNoticeFactory("Unable to load payment portal, please try again later", error));
            })
            .then((Z:ZuoraPaymentPage.ZuoraPaymentPageStatic) => {
                let deferred = this.$q.defer();

                this.setStatus('awaitingInput');

                Z.render(paymentPageParameters, {}, (response:ZuoraPaymentPage.Response) => {
                    if (response.success == 'true') {
                        let paymentMethod = new ZuoraPaymentMethod({
                            Id: response.refId
                        });

                        this.$analytics.eventTrack('Added payment method', {
                            category: 'Checkout',
                            label: 'success'
                        });

                        deferred.resolve(paymentMethod);
                    } else {

                        this.$analytics.eventTrack('Added payment method', {
                            category: 'Checkout',
                            label: 'failure'
                        });

                        deferred.reject(this.dismissableErrorNoticeFactory("Unable to process payment method, please try again later", response));
                    }
                });

                return deferred.promise;
            });

    };

    /**
     * Generate a dismissible error notice, when invoked will log to the console and notify the issue to the user
     * @param message
     * @param detail
     * @returns {function(): angular.IPromise<any>}
     */
    private dismissableErrorNoticeFactory(message:string, detail?:any):IDismissableErrorNotice {
        return () => {
            console.error(message, detail, "Status Log:", this.statusLog);
            return this.$mdDialog.show(this.$mdDialog.alert()
                .clickOutsideToClose(false)
                .title('Error')
                .textContent(message)
                .ok('Continue')
                .ariaLabel('Continue')
            );
        };
    }

    /**
     * Helper function to show the spinner only on the loading statuses
     * @returns {boolean}
     */
    public isLoading():boolean {
        let loadingEvents:TPaymentMethodStatus[] = ['loadingSignature', 'loadingPortal', 'processingPaymentMethod', 'retrievingMethod'];

        return _.includes(loadingEvents, this.status);
    }

    /**
     * Determine if the zuora section should be visible or not
     * @returns {boolean}
     */
    public zuoraSectionVisible():boolean {
        return this.status === PaymentMethodController.awaitingInputStatus;
    }

}

class PaymentMethodDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['?ngModel', 'paymentMethod'];
    public template = require('./paymentMethod.tpl.html');
    public replace = true;
    public scope = {
        user: '=',
        region: '=',
        allowNew: '@'
    };

    public controllerAs = 'PaymentMethodController';
    public controller = PaymentMethodController;
    public bindToController = true;

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, PaymentMethodController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerPaymentRefIdChangedHandler((paymentMethod:ZuoraPaymentMethod) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(paymentMethod);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                directiveController.paymentMethod = $ngModelController.$modelValue;

                if (directiveController.paymentMethod && directiveController.paymentMethod.PaymentMethodStatus == 'Active') {
                    directiveController.isUsingExistingPaymentMethod = true;
                }

            };

        }

    };

    static factory():ng.IDirectiveFactory {
        return () => new PaymentMethodDirective();
    }
}

angular.module(namespace, [])
    .directive('paymentMethod', PaymentMethodDirective.factory())
;

