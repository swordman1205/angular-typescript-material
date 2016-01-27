import * as angular from "angular";
import * as _ from "lodash";

export const namespace = 'common.services.notification';

export interface IToastData {
    content:string;
    action?:string;
    resolve?:() => void
}
export interface IToastScope extends ng.IScope {
    toast:IToastData;
}

export type TToastColour = 'green' | 'red';

// Default Color constant
export const TOAST_COLOUR_GREEN:TToastColour = 'green';
export const TOAST_COLOUR_RED:TToastColour = 'red';

export class Toast {

    private toastOptions:ng.material.IToastOptions;

    private timeOut:number;
    private actionName:string;

    constructor(private message:string,
                private className:TToastColour,
                private $mdToast:ng.material.IToastService,
                private $rootScope:ng.IRootScopeService,
                private $timeout:ng.ITimeoutService) {

        this.toastOptions = {
            hideDelay: 2000,
            position: 'top',
            template: `
                    <md-toast class="md-toast-fixed ${className}" ng-class="{\'md-capsule\': toast.capsule}">
                        <span flex>{{toast.content}}</span>
                        <md-dialog-actions ng-if="toast.action">
                            <md-button ng-click="toast.resolve()" ng-class="{\'md-highlight\': toast.highlightAction}">
                            {{ toast.action }}
                        </md-button>
                        </md-dialog-actions>
                    </md-toast>
                `,
        };
    }

    /**
     * Override or add toast options
     *
     * @param toastOptions
     * @returns {Toast}
     */
    public options(toastOptions:any) {

        _.merge(this.toastOptions, toastOptions);
        if (_.has(toastOptions, 'parent')) {
            this.toastOptions.template = this.toastOptions.template.replace('class="md-toast-fixed', 'class="');
        }

        return this;

    }

    /**
     * Add a delay before showing the toast
     *
     * @param milliseconds
     */
    public delay(milliseconds:number) {

        this.timeOut = milliseconds;

        return this;

    }

    public action(action:string) {
        this.actionName = action;
        return this;
    }

    /**
     * Show the toast
     */
    public pop():ng.IPromise<any> {

        let $scope:IToastScope = <IToastScope>this.$rootScope.$new();

        $scope.toast = {
            content: this.message,
            action: this.actionName,
            resolve: () => {
                this.$mdToast.hide(this.actionName);
            }
        };

        _.merge(this.toastOptions, {
            scope: $scope
        });

        if (_.isNumber(this.timeOut)) {
            // See: https://docs.angularjs.org/api/ng/service/$timeout. ITimeoutService does not have final param
            // which is passed into your function.

            return this.$timeout(() => {
                return this.$mdToast.show(this.toastOptions);
            }, this.timeOut);

        }
        else {
            return this.$mdToast.show(this.toastOptions);
        }

    }

}

export default class NotificationService {

    static $inject:string[] = ['$mdToast', '$rootScope', '$timeout'];

    constructor(private $mdToast:ng.material.IToastService,
                private $rootScope:ng.IRootScopeService,
                private $timeout:ng.ITimeoutService) {
    }

    /**
     * Get an instance of Toast
     *
     * @param message
     * @param className
     * @return {Toast}
     */
    public toast(message:string, className:TToastColour = TOAST_COLOUR_GREEN):Toast {
        return new Toast(message, className, this.$mdToast, this.$rootScope, this.$timeout);
    }

}

angular.module(namespace, [])
    .service('notificationService', NotificationService);





