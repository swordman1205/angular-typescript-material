import {expect} from "../../../testBootstrap.spec";
import ProgramOptionType from "./programOptionTypeModel";
describe('Program Option Type Model', () => {

    it('should instantiate a new program option type', () => {

        let programOptionType = new ProgramOptionType({});

        expect(programOptionType).to.be.instanceOf(ProgramOptionType);

    });

});

