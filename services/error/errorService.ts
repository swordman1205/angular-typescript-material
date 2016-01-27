import * as angular from "angular";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {namespace as notFound} from "../../../app/error/notFound/notFound";

export const namespace = 'common.services.error';

export class ErrorInit {

    static $inject:string[] = ['ngRestAdapter', 'errorService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                errorService:ErrorService) {

        ngRestAdapter.registerApiErrorHandler((requestConfig:ng.IRequestConfig, responseObject:ng.IHttpPromiseCallbackArg<any>):void => {

            let message = <string>_.get(responseObject, 'data.message');

            if (!message) {
                message = "No response message";
            }

            errorService.showError(
                `Error encountered attempting to call <code>${requestConfig.url}</code> with method <code>${requestConfig.method}</code></span>`,
                message,
                {
                    request: requestConfig,
                    response: responseObject,
                }
            );

        });
    }

}

export default class ErrorService {

    static $inject:string[] = ['$timeout', '$mdDialog', '$state', '$log', '$location'];

    constructor(private $timeout:ng.ITimeoutService,
                private $mdDialog:ng.material.IDialogService,
                private $state:ng.ui.IStateService,
                private $log:ng.ILogService,
                private $location:ng.ILocationService) {

    }

    public showError(title:string, message:string, extra?:any, $event:MouseEvent = null):ng.IPromise<boolean> {

        let dialogConfig:ng.material.IDialogOptions = {
            template: require('./errorDialog.tpl.html'),
            controller: namespace + '.controller',
            controllerAs: 'ErrorDialogController',
            clickOutsideToClose: true,
            locals: {
                title: title,
                message: message,
                extra: extra,
            },
            targetEvent: $event
        };

        this.$log.error(title.substr(0, 40), message.substr(0, 120), extra);

        return this.$timeout(_.noop) //first do an empty timeout to allow the controllers to init if login prompt is fired from within a .run() phase
            .then(() => this.$mdDialog.show(dialogConfig));

    }

    public redirectNotFoundPage() {
        this.$location.path(this.$state.href(notFound)).replace();
    }
    
}

export class ErrorDialogController {

    static $inject:string[] = ['$mdDialog', 'title', 'message', 'extra'];

    constructor(private $mdDialog:ng.material.IDialogService,
                private title:string,
                private message:string,
                private extra:any) {
    }

    /**
     * allow the user to manually close the dialog
     */
    public cancelErrorDialog() {
        this.$mdDialog.cancel('dismissed');
    }

}

angular.module(namespace, [])
    .run(ErrorInit)
    .service('errorService', ErrorService)
    .controller(namespace + '.controller', ErrorDialogController);





