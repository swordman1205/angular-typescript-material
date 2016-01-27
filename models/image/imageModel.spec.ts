import {expect, seededChance} from "../../../testBootstrap.spec";
import Image from "./imageModel";

describe('Image Model', () => {

    let imageData = {
        imageId: seededChance.guid(),
        version: Math.floor(chance.date().getTime() / 1000),
        folder: seededChance.word(),
        format: seededChance.pick(['gif', 'jpg', 'png']),
        alt: seededChance.sentence(),
        title: chance.weighted([null, seededChance.sentence()], [1, 2]),
    };

    it('should instantiate a new image', () => {

        let image = new Image(imageData);

        expect(image).to.be.instanceOf(Image);

    });

});

