import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import RichText from "./sections/richTextModel";
import Blockquote from "./sections/blockquoteModel";
import Media from "./sections/mediaModel";
import Promo from "./sections/promoModel";
import IngredientsDirections from "./sections/ingredientsDirections";
import {AbstractModel, IAttributeCastMap, INestedEntityMap} from "../abstractModel";
import Localization from "../localization/localizationModel";
import RecipeInfoBar from "./sections/recipeInfoBar";
export interface IFormatOption {
    name:string;
    key:string;
}

export interface ISectionFormattingOptions {
    alignment:IFormatOption[];
    size:IFormatOption[];
    style:IFormatOption[];
    height:IFormatOption[];
}

export interface ISectionTypeModelMap {
    [key:string]:ISectionStatic;
    // [key:TSectionModelType] : TSectionModel; //not working due to https://github.com/Microsoft/TypeScript/issues/7656
}

export interface ISectionStatic {
    new (data:any, exists:boolean):TSectionModel;
}

export type TSectionModelType = 'rich_text' | 'blockquote' | 'media' | 'promo' | 'ingredients_directions' | 'recipe_info_bar';
export type TSectionModel = RichText|Blockquote|Media|Promo|IngredientsDirections;
export type TSectionWidthModel = 'full' | 'twoThird' | 'oneThirs';
export type TSectionHeightModel = 'twoToOne' | 'oneToOne' | 'natural';

@changeAware
export default class Section<T extends AbstractModel> extends AbstractModel {

    protected __primaryKey = 'sectionId';

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    protected __nestedEntityMap:INestedEntityMap = {
        content: this.hydrateSection,
        _localizations: Localization,
    };

    public sectionId:string;
    public content:T;
    public format:{
        alignment?:string;
        size?:TSectionWidthModel;
        height?:TSectionHeightModel;
        style?:string;
    };
    public type:TSectionModelType;
    public createdAt:moment.Moment;
    public updatedAt:moment.Moment;

    public _localizations:Localization<Section<T>>[] = [];
    public __parentModel:AbstractModel;

    constructor(data:any, exists:boolean = false, parentModel:AbstractModel = null) {
        super(data, exists);
        this.__parentModel = parentModel;
        this.hydrate(data, exists);
    }

    public static getContentType(type:TSectionModelType = null):ISectionTypeModelMap|ISectionStatic {

        let sectionTypeMap:ISectionTypeModelMap = {
            [RichText.contentType]: RichText,
            [Blockquote.contentType]: Blockquote,
            [Media.contentType]: Media,
            [Promo.contentType]: Promo,
            [IngredientsDirections.contentType]: IngredientsDirections,
            [RecipeInfoBar.contentType]: RecipeInfoBar,
        };

        if (!type) {
            return sectionTypeMap;
        }

        return sectionTypeMap[type];
    }

    private hydrateSection(data:any, exists:boolean):TSectionModel {

        let SectionClass = <ISectionStatic>Section.getContentType(data.type);

        return new SectionClass(data.content, exists);
    }

}




