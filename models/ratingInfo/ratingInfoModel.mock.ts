import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import RatingInfo from "./ratingInfoModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export default class RatingInfoMock extends AbstractMock {

    public getModelClass():IModelClass {
        return RatingInfo;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            postRatingInfoId: seededChance.guid(),
            body: seededChance.paragraph(),
            createdAt: moment(seededChance.date())
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):RatingInfo {
        return <RatingInfo> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):RatingInfo[] {
        return <RatingInfo[]>new this().buildCollection(count, overrides, exists);
    }

}

