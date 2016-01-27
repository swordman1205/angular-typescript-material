import * as _ from "lodash";
import {AbstractModel, INestedEntityMap} from "../abstractModel";
import Permission from "./permission/permissionModel";

export default class Role extends AbstractModel {

    static adminRoleKey:string = 'admin';
    static knownRoles:string[] = [Role.adminRoleKey];

    protected __nestedEntityMap:INestedEntityMap = {
        _permissions: this.hydratePermissions,
    };

    protected __primaryKey = 'key';

    public key:string;
    public description:string;
    public isDefault:boolean;
    public type:string;

    public _permissions:Permission[];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Hydrate the permission models, referencing the parent role each time
     * @param data
     * @param exists
     * @returns {role.Permission[]}
     */
    private hydratePermissions(data:any, exists:boolean):Permission[] {

        return _.map(data['_permissions'], (entityData) => {

            let permission:Permission = <any>this.hydrateModel(entityData, Permission, exists);

            permission.__grantedByRole = this;
            return permission;

        });

    }

}

