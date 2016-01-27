import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Image from "./imageModel";
export default class ImageMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Image;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            imageId: seededChance.guid(),
            version: Math.floor(chance.date().getTime() / 1000),
            folder: seededChance.word(),
            format: seededChance.pick(['gif', 'jpg', 'png']),
            alt: seededChance.sentence(),
            title: chance.weighted([null, seededChance.sentence()], [1, 2]),
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Image {
        return <Image> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Image[] {
        return <Image[]>new this().buildCollection(count, overrides, exists);
    }

}


