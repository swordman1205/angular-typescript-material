import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import User from "./userModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export default class UserMock extends AbstractMock {

    public getModelClass():IModelClass {
        return User;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            userId: seededChance.guid(),
            email: seededChance.email(),
            username: seededChance.name().toLowerCase().replace(' ', '.'),
            firstName: seededChance.first(),
            lastName: seededChance.last(),
            emailConfirmed: moment(seededChance.date()).toISOString(),
            country: seededChance.country(),
            avatarImgUrl: seededChance.url(),
            regionCode: seededChance.pick(['uk', 'us', 'gb']),
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):User {
        return <User> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):User[] {
        return <User[]>new this().buildCollection(count, overrides, exists);
    }

}

