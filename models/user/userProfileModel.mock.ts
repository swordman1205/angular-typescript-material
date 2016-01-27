import * as _ from "lodash";
import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import UserProfile from "./userProfileModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export default class UserProfileMock extends AbstractMock {

    public getModelClass():IModelClass {
        return UserProfile;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            dob: moment(seededChance.birthday()).toDate(),
            mobile: seededChance.phone({mobile: true}),
            phone: seededChance.phone(),
            gender: seededChance.pick(_.map(UserProfile.genderOptions, 'value')),
            about: seededChance.paragraph(),
            facebook: seededChance.url({domain: 'www.facebook.com'}),
            twitter: seededChance.twitter(),
            pinterest: seededChance.url({domain: 'www.pintrest.com'}),
            instagram: seededChance.url({domain: 'www.instagram.com'}),
            website: seededChance.url(),
            displayRole: seededChance.pick(['Admin', 'Ambassador'])
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):UserProfile {
        return <UserProfile> new this().buildEntity(overrides, exists);
    }

}

