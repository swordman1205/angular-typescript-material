import {expect} from "../../../../testBootstrap.spec";
import MediaMock from "./mediaModel.mock";
import Media from "./mediaModel";
describe('Media Model', () => {

    it('should instantiate a new media', () => {

        let mediaData = (new MediaMock).getMockData();

        let media = new Media(mediaData);

        expect(media).to.be.instanceOf(Media);

    });

    it('should mock a section media', () => {

        expect(MediaMock.entity()).to.be.instanceOf(Media);
    });

});

