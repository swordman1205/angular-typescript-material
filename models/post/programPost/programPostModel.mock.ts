import {AbstractMock} from "../../abstractModel.mock";
import {IModelClass} from "../../abstractModel";
import ProgramPost from "./programPostModel";
import UserMock from "../../user/userModel.mock";
export default class ProgramPostMock extends AbstractMock {

    public getModelClass():IModelClass {
        return ProgramPost;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let authorOverride = seededChance.bool();

        let author = UserMock.entity();

        return {
            postId: seededChance.guid(),
            title: seededChance.string(),
            shortTitle: seededChance.word(),
            permalink: chance.word({syllables: 3}),
            draft: seededChance.bool(),
            authorId: author.userId,
            thumbnailImageId: seededChance.guid(),
            authorOverride: authorOverride ? seededChance.name() : null,
            authorWebsite: authorOverride ? seededChance.url() : null,
            showAuthorPromo: seededChance.bool(),
            _metas: [],
            _tags: [],
            _comments: [],
            _sections: [],
            _localizations: [],
            _author: author
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):ProgramPost {
        return <ProgramPost> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):ProgramPost[] {
        return <ProgramPost[]>new this().buildCollection(count, overrides, exists);
    }

}

