import * as angular from "angular";
import * as _ from "lodash";

export const namespace = 'common.services.utility';

export interface IPromiseFactory {
    (arg?:any, ...args:any[]):ng.IPromise<any>;
}

export default class UtilityService {

    static $inject:string[] = ['$q'];

    constructor(private $q:ng.IQService) {
    }

    public serialPromise<T>(promiseFactories:IPromiseFactory[], initialValue:T, thisArg:any = null, ...args:any[]):ng.IPromise<T> {
        return _.reduce(promiseFactories, (soFar:ng.IPromise<T>, next:IPromiseFactory):ng.IPromise<T> => {

            return soFar.then((result):ng.IPromise<T> => {
                return next.call(thisArg, result, ...args);
            });

        }, this.$q.when(initialValue))
    }

}

angular.module(namespace, [])
    .service('utilityService', UtilityService);





