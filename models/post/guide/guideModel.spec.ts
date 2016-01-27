import {expect} from "../../../../testBootstrap.spec";
import Guide from "./guideModel";
describe('Guide Model', () => {

    it('should instantiate a new guide', () => {

        let guide = new Guide({});

        expect(guide).to.be.instanceOf(Guide);

    });

});

