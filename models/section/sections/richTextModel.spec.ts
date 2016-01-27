import {expect} from "../../../../testBootstrap.spec";
import RichTextMock from "./richTextModel.mock";
import RichText from "./richTextModel";
describe('RichText Model', () => {

    it('should instantiate a new image', () => {

        let imageData = (new RichTextMock).getMockData();

        let image = new RichText(imageData);

        expect(image).to.be.instanceOf(RichText);

    });

    it('should mock a section rich text', () => {

        expect(RichTextMock.entity()).to.be.instanceOf(RichText);
    });

});

