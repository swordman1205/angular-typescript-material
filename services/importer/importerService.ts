import * as angular from "angular";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";

export const namespace = 'common.services.importer';

interface IImportCredentials {
    username:string;
    password:string;
}

export default class ImporterService {

    static $inject:string[] = ['ngRestAdapter', '$q'];

    constructor(private ngRestAdapter:NgRestAdapterService) {
    }

    public importData(recipeId:string, skipInterceptor:boolean = true):ng.IPromise<any> {

        return this.ngRestAdapter
            .skipInterceptor(() => skipInterceptor)
            .get('/utility/wordpress-recipe/' + recipeId)
            .then((res:ng.IHttpPromiseCallbackArg<any>) => {
                return res.data;
            });

    }
}

angular.module(namespace, [])
    .service('importerService', ImporterService);





