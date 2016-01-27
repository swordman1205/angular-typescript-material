import {expect, seededChance} from "../../../testBootstrap.spec";
import Tag from "./tagModel";

describe('Tag Model', () => {

    let tagData = {
        tagId: seededChance.guid(),
        tag: seededChance.word(),
    };

    it('should instantiate a new tag', () => {

        let tag = new Tag(tagData);

        expect(tag).to.be.instanceOf(Tag);

    });

});

