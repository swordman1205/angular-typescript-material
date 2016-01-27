import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Comment from "./commentModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
export default class CommentMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Comment;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            postCommentId: seededChance.guid(),
            body: seededChance.paragraph(),
            createdAt: moment(seededChance.date())
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Comment {
        return <Comment> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Comment[] {
        return <Comment[]>new this().buildCollection(count, overrides, exists);
    }

}

