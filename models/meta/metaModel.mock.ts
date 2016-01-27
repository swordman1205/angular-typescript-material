import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Meta from "./metaModel";
export default class MetaMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Meta;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            metaId: seededChance.guid(),
            metaName: seededChance.pick(['name', 'description', 'keyword', 'canonical', 'other']),
            metaContent: seededChance.string()
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Meta {
        return <Meta> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Meta[] {
        return <Meta[]>new this().buildCollection(count, overrides, exists);
    }

}

