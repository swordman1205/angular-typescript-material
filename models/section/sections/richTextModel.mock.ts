import {AbstractMock} from "../../abstractModel.mock";
import {IModelClass} from "../../abstractModel";
import RichText from "./richTextModel";
export default class RichTextMock extends AbstractMock {

    public getModelClass():IModelClass {
        return RichText;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            body: seededChance.paragraph(),
        };
    }

    public static entity(overrides:Object = {}, exists:boolean = true):RichText {
        return <RichText> new this().buildEntity(overrides, exists);
    }

}

