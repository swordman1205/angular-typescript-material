import * as _ from "lodash";
import {AbstractModel} from "../../abstractModel";
import Role from "../roleModel";

export interface IMatchingRoutePermission {
    method:string;
    uri:string;
}

export default class Permission extends AbstractModel {

    protected __primaryKey = 'key';

    public key:string;
    public description:string;
    public type:string;
    public matchingRoutes:IMatchingRoutePermission[];

    public __grantedByRole:Role;
    public __grantedByAll:Role[];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public getGrantedByRoleNames():string {
        return _.map(this.__grantedByAll, 'key').join(', ');
    }

}