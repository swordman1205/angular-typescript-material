import * as angular from "angular";
import {AbstractApiService} from "../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../pagination/paginationService";
import Role from "../../models/role/roleModel";

export const namespace = 'common.services.role';

export default class RoleService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', 'ngJwtAuthService', '$mdDialog', 'regionService'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Article given data
     * @param data
     * @returns {Article}
     * @param exists
     */
    public modelFactory(data:any, exists:boolean = false):Role {
        return new Role(data, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint(role?:Role):string {
        if (role) {
            return '/roles/' + role.getKey();
        }
        return '/roles';
    }

}

angular.module(namespace, [])
    .service('roleService', RoleService);





