import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import RoleMock from "./roleModel.mock";
import Role from "./roleModel";

describe('Role Model', () => {

    let data = _.clone(RoleMock.entity());

    it('should instantiate a new role', () => {

        let role = new Role(data);

        expect(role).to.be.instanceOf(Role);
    });

});

