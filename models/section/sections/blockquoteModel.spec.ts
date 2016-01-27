import {expect} from "../../../../testBootstrap.spec";
import BlockquoteMock from "./blockquoteModel.mock";
import Blockquote from "./blockquoteModel";
describe('Blockquote Model', () => {

    it('should instantiate a new blockquote', () => {

        let blockquoteData = (new BlockquoteMock).getMockData();

        let blockquote = new Blockquote(blockquoteData);

        expect(blockquote).to.be.instanceOf(Blockquote);

    });

    it('should mock a section blockquote', () => {

        expect(BlockquoteMock.entity()).to.be.instanceOf(Blockquote);
    });

});

