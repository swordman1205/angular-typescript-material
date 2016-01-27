import * as angular from "angular";
import {AbstractApiService} from "../abstractApiService";
import DietaryRestriction from "../../models/dietary/dietaryRestrictionModel";

export const namespace = 'common.services.dietaryRestriction';

export default class DietaryRestrictionService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q'];

    /**
     * Get an instance of the DietaryRestriction given data
     * @param data
     * @returns {DietaryRestriction}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):DietaryRestriction {
        return new DietaryRestriction(data, exists);
    }

    /**
     * Get the api endpoint for the entity
     * @param entity
     * @returns {string}
     */
    public apiEndpoint(entity?:DietaryRestriction):string {
        return '/dietary-restrictions';
    }

}

angular.module(namespace, [])
    .service('dietaryRestrictionService', DietaryRestrictionService);





