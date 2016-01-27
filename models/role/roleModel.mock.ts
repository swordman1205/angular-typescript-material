import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Role from "./roleModel";
export default class RoleMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Role;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            key: seededChance.pick(Role.knownRoles),
            description: seededChance.sentence(),
            isDefault: false,
            type: 'role',
            _permissions: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Role {
        return <Role> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):Role[] {
        return <Role[]>new this().buildCollection(count);
    }

}

