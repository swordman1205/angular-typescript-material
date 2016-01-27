import * as angular from "angular";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import SystemInformation from "../../models/systemInformation/systemInformationModel";
import * as _ from "lodash";

export const namespace = 'common.services.systemInformation';

export default class SystemInformationService {

    static $inject:string[] = ['ngRestAdapter', '$q'];

    constructor(private ngRestAdapter:NgRestAdapterService,
                private $q:ng.IQService) {

    }

    /**
     * Get an instance of the SystemInformation given merged headers
     * @param data
     * @returns {SystemInformation}
     * @param exists
     */
    public modelFactory(data:any, exists:boolean = false):SystemInformation {
        return new SystemInformation(data, exists);
    }
    /**
     * Get an instance of the SystemInformation given all headers
     * @param headers
     * @returns {Article}
     * @param exists
     */
    private parseHeaders(headers:any, exists:boolean = false):any {

        return _.chain(headers)
            .pickBy((value, key:string) => _.startsWith(key, 'spira'))
            .mapKeys((value, key:string) => _.camelCase(key))
            .value();

    }

    /**
     * Get all countries from the API
     * @returns {any}
     */
    public getSystemInformation():ng.IPromise<SystemInformation> {

        let appPromise = this.ngRestAdapter.api('/').options('')
            .then((res:ng.IHttpPromiseCallbackArg<any>) => this.parseHeaders(res.headers()));


        let apiPromise = this.ngRestAdapter.options('/countries-timezones') //can be any route, we just pick on that should be fast
            .then((res:ng.IHttpPromiseCallbackArg<any>) => this.parseHeaders(res.headers()));

        return this.$q.all({app: appPromise, api: apiPromise})
            .then((parsed:any) => {
                return this.modelFactory(_.merge(parsed.app, parsed.api), true);
            });
    }

}

angular.module(namespace, [])
    .service('systemInformationService', SystemInformationService);





