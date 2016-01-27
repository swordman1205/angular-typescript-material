import {expect} from "../../../testBootstrap.spec";
import ProgramOption from "./programOptionModel";
describe('Program Option Model', () => {

    it('should instantiate a new program option', () => {

        let programOption = new ProgramOption({});

        expect(programOption).to.be.instanceOf(ProgramOption);

    });

});

