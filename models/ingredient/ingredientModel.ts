import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap} from "../abstractModel";
import {TaggableModel} from "../../mixins/taggableModel";
import {LocalizableModel} from "../../mixins/localizableModel";
import {LinkingTag, CategoryTag} from "../tag/tagModel";
import DietaryRestriction from "../dietary/dietaryRestrictionModel";
import MetricInputOption from "../metricInputOption/metricInputOptionModel";
import Localization from "../localization/localizationModel";
import Article from "../post/article/articleModel";
import Recipe from "../recipe/recipeModel";

export type IYieldType = 'grams'|'millilitres'|'small'|'medium'|'large';
export const GRAMS_YIELD_TYPE:IYieldType = 'grams';
export const MILLILITRES_YIELD_TYPE:IYieldType = 'millilitres';
export const SMALL_YIELD_TYPE:IYieldType = 'small';
export const MEDIUM_YIELD_TYPE:IYieldType = 'medium';
export const LARGE_YIELD_TYPE:IYieldType = 'large';

@changeAware
export default class Ingredient extends AbstractModel implements TaggableModel, LocalizableModel {

    protected __primaryKey = 'ingredientId';

    protected __nestedEntityMap:INestedEntityMap = {
        _tags: LinkingTag,
        _categoryTags: CategoryTag,
        _dietaryRestrictions: DietaryRestriction,
        _metricInputOptions: MetricInputOption,
        _localizations: Localization,
    };

    public ingredientId:string;
    public name:string;
    public approvedBy:string;
    
    public recipeId:string;
    public recipeIngredientCompulsory:boolean;
    public recipeYield:number;
    public recipeYieldType:IYieldType = MILLILITRES_YIELD_TYPE;

    public static measuredByVolume = 'volume';
    public static measuredByWeight = 'weight';
    public measuredBy:string = Ingredient.measuredByVolume;
    public cupSpoonMeasuresEnabled:boolean;
    public gramsPerCup:number;
    public unitCountsEnabled:boolean;
    public unitName:string;
    public smallStandardWeight:number;
    public mediumStandardWeight:number;
    public largeStandardWeight:number;

    public __ingredientIsRecipe:boolean;

    public _tags:LinkingTag[] = [];
    public _dietaryRestrictions:DietaryRestriction[] = [];
    public _metricInputOptions:MetricInputOption[];
    public _localizations:Localization<Article>[] = [];
    public _recipe:Recipe;
    public _supermarketAisles:LinkingTag[] = [];

    public static tagGroups:string[] = [
        'Category', 'General'
    ];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
        
        this.__ingredientIsRecipe = !!this.recipeId;
    }

    /**
     * Get the recipe identifier
     * @returns {string}
     */
    public getIdentifier():string {

        return this.ingredientId;
    }

    /**
     * Some fields have to be null when when others are set
     * This function cleans all those fields
     */
    public cleanProperties():void {

        if (this.measuredBy == Ingredient.measuredByVolume) {
            this.cupSpoonMeasuresEnabled = null;
            this.unitCountsEnabled = null;
        }
        else {
            // These are required when the ingredient is measured by weight
            if (!this.unitCountsEnabled) {
                this.unitCountsEnabled = false;
            }
            if (!this.cupSpoonMeasuresEnabled) {
                this.cupSpoonMeasuresEnabled = false;
            }
        }

        if (!this.unitCountsEnabled) {
            this.unitName = null;
            this.smallStandardWeight = null;
            this.mediumStandardWeight = null;
            this.largeStandardWeight = null;
        }

        if (!this.cupSpoonMeasuresEnabled) {
            this.gramsPerCup = null;
        }

        if (!this.__ingredientIsRecipe) {
            this.recipeId = null;
            this.recipeIngredientCompulsory = false;
            this.recipeYield = null;
            this.recipeYieldType = null;
        }

    }

    /**
     * Get the super market aisle for this ingredient.
     * @param superMarketAisleTagId
     * @returns {string}
     */
    public getSuperMarketAisle(superMarketAisleTagId:string):string {

        return _.find(this._tags, {_pivot: {tagGroupId: superMarketAisleTagId}}).tag;

    }

    /**
     * Getter for the ingredients recipeYieldTypes
     * @returns {IYieldType[]}
     */
    get recipeYieldTypes():IYieldType[] {

        let recipeYieldTypes:IYieldType[] = [];

        if (this.measuredBy == Ingredient.measuredByVolume) {
            recipeYieldTypes.push(MILLILITRES_YIELD_TYPE);
        }
        else {
            recipeYieldTypes.push(GRAMS_YIELD_TYPE);
        }

        if (this.smallStandardWeight) {
            recipeYieldTypes.push(SMALL_YIELD_TYPE);
        }

        if (this.mediumStandardWeight) {
            recipeYieldTypes.push(MEDIUM_YIELD_TYPE);
        }

        if (this.largeStandardWeight) {
            recipeYieldTypes.push(LARGE_YIELD_TYPE);
        }

        return recipeYieldTypes;
    }

}

