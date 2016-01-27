import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import SystemInformation from "./systemInformationModel";
export default class SystemInformationMock extends AbstractMock {

    public getModelClass():IModelClass {
        return SystemInformation;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            spiraLoadbalancerVersion: "%ciBuild.id%",
            spiraAppVersion: "%ciBuild.id%",
            spiraApiVersion: "%ciBuild.id%",
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):SystemInformation {
        return <SystemInformation>new this().buildEntity(overrides, exists);
    }

}

