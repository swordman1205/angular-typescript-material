import * as _ from "lodash";
import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Section, {TSectionModelType} from "./sectionModel";
import RichText from "./sections/richTextModel";
import RichTextMock from "./sections/richTextModel.mock";
import Blockquote from "./sections/blockquoteModel";
import BlockquoteMock from "./sections/blockquoteModel.mock";
import Media from "./sections/mediaModel";
import MediaMock from "./sections/mediaModel.mock";
import Promo from "./sections/promoModel";
import PromoMock from "./sections/promoModel.mock";
import IngredientsDirections from "./sections/ingredientsDirections";
import IngredientsDirectionsMock from "./sections/ingredientsDirections.mock";
import RecipeInfoBar from "./sections/recipeInfoBar";
import RecipeInfoBarMock from "./sections/recipeInfoBar.mock";

export default class SectionMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Section;
    }

    public getMockData(overrides:Object = {}):Object {

        let seededChance = new Chance();

        let type:TSectionModelType = (<any>overrides).type || seededChance.pick(_.keys(Section.getContentType()));

        return {
            sectionId: seededChance.guid(),
            type: type,
            content: SectionMock.getContentTypeMap()[type].entity(),
            _localizations: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Section<any> {
        return new this().buildEntity<Section<any>>(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Section<any>[] {
        return new this().buildCollection<Section<any>>(count, overrides, exists);
    }

    public static getContentTypeMap() {
        return {
            [RichText.contentType]: RichTextMock,
            [Blockquote.contentType]: BlockquoteMock,
            [Media.contentType]: MediaMock,
            [Promo.contentType]: PromoMock,
            [IngredientsDirections.contentType]: IngredientsDirectionsMock,
            [RecipeInfoBar.contentType]: RecipeInfoBarMock,
        };
    }

}

