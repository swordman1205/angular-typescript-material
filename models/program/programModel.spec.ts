import {expect} from "../../../testBootstrap.spec";
import Program from "./programModel";

describe('Program Model', () => {

    it('should instantiate a new program', () => {

        let program = new Program({});

        expect(program).to.be.instanceOf(Program);

    });

});

