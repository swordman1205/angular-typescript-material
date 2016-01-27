import {expect} from "../../../../testBootstrap.spec";
import ProgramPost from "./programPostModel";
describe('Program Post Model', () => {

    it('should instantiate a new program post', () => {

        let programPost = new ProgramPost({});

        expect(programPost).to.be.instanceOf(ProgramPost);

    });

});

