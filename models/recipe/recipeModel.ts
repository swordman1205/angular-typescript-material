import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {
    AbstractModel,
    IMetaableModel,
    IPermalinkableModel,
    INestedEntityMap,
    IAttributeCastMap
} from "../abstractModel";
import {PublishableModel, TPublishableStatus} from "../../mixins/publishableModel";
import {LocalizableModel} from "../../mixins/localizableModel";
import {TaggableModel} from "../../mixins/taggableModel";
import {SectionableModel, ISectionsDisplay} from "../../mixins/sectionableModel";
import Tag, {DietaryBadge, LinkingTag} from "../tag/tagModel";
import User from "../user/userModel";
import Comment from "../comment/commentModel";
import RecipeGroup from "./recipeGroupModel";
import RecipeIngredient from "./recipeIngredientModel";
import Direction from "../direction/directionModel";
import Meta from "../meta/metaModel";
import Localization from "../localization/localizationModel";
import RatingInfo from "../ratingInfo/ratingInfoModel";
import Section from "../section/sectionModel";
import Meal from "../meal/mealModel";
import MealPlan from "../mealPlan/mealPlanModel";
import SpiraException from "../../../exceptions";
import applyMixins from "../../mixins/mixins";
import Image from "../image/imageModel";

export type TRecipeDifficulty = 'hard'|'medium'|'easy';

export const DIFFICULTY_HARD:TRecipeDifficulty = 'hard';
export const DIFFICULTY_MEDIUM:TRecipeDifficulty = 'medium';
export const DIFFICULTY_EASY:TRecipeDifficulty = 'easy';

export interface IMealPivot {
    mealId?:string;
    mealPlanId?:string;
    recipeId:string;
}

@changeAware
export default class Recipe extends AbstractModel implements SectionableModel, TaggableModel, LocalizableModel, IMetaableModel, IPermalinkableModel, PublishableModel {

    protected __primaryKey:string = 'recipeId';
    static __shortcode:string = 'recipe';

    protected __nestedEntityMap:INestedEntityMap = {
        _tags: Tag,
        _author: User,
        _groups: RecipeGroup,
        _sections: this.hydrateSections,
        _ingredients: RecipeIngredient,
        _directions: Direction,
        _metas: Meta,
        _badges: DietaryBadge,
        _thumbnailImage: Image,
        _localizations: Localization,
        _comments: Comment,
        _ratingInfo: RatingInfo,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
        prepTime: this.castTime,
        cookTime: this.castTime,
        addedSugarTsps: this.castNumber,
        published: this.castMoment
    };

    public recipeId:string;
    public sourceId:number;
    public title:string;
    public shortTitle:string;
    public permalink:string;
    public authorId:string;
    public thumbnailImageId:string;
    public excerpt:string;
    
    public draft:boolean;
    public published:moment.Moment;
    public prepTime:moment.Duration;
    public servings:number;
    public cookTime:moment.Duration;
    public addedSugarTsps:number;
    public difficulty:TRecipeDifficulty;

    public showAuthorPromo:boolean;
    public authorOverride:string;
    public authorWebsite:string;

    public publicAccess:boolean;
    public usersCanComment:boolean;

    public sectionsDisplay:ISectionsDisplay;
    public groupOrder:string[] = [];

    public _tags:LinkingTag[] = [];
    public _groups:RecipeGroup[] = [];
    public _author:User;
    public _thumbnailImage:Image;
    public _sections:Section<any>[] = [];
    public _ingredients:RecipeIngredient[] = [];
    public _directions:Direction[] = [];
    public _localizations:Localization<Recipe>[] = [];
    public _metas:Meta[] = [];
    public _badges:Tag[] = [];
    public _comments:Comment[] = [];
    public _ratingInfo:RatingInfo;

    public _pivot:IMealPivot;

    public static tagGroups:string[] = [
        'Courses', 'Occasions', 'Seasons', 'Anchor Topics', 'General'
    ];

    // Sectionable Model
    public updateSectionsDisplay:() => void;
    public hydrateSections:(data:any, exists:boolean) => Section<any>[];

    // Publishable Model
    public getStatus:() => TPublishableStatus;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
        this.updateGroups();
    }

    /**
     * Get the recipe identifier
     * @returns {string}
     */
    public getIdentifier():string {

        return this.permalink || this.recipeId;

    }

    public updateGroups(reSort:boolean = true):void {

        _.each(this._groups, (group:RecipeGroup) => {
            group.reset();
        });

        _.each(this._ingredients, (ingredient:RecipeIngredient) => {

            this.assignToGroup(ingredient, ingredient._pivot.groupId);
        });

        _.each(this._directions, (direction:Direction) => {

            this.assignToGroup(direction, direction.groupId);
        });

        if (reSort) {
            _.each(this._groups, (group:RecipeGroup) => {

                if (_.isObject(group.entityOrder)) {

                    if (_.isArray(group.entityOrder.directions)) {

                        group.__directions = _.sortBy(group.__directions, (direction:Direction) => _.indexOf(group.entityOrder.directions, direction.getKey()));
                    }

                    if (_.isArray(group.entityOrder.ingredients)) {

                        group.__ingredients = _.sortBy(group.__ingredients, (ingredient:RecipeIngredient) => _.indexOf(group.entityOrder.ingredients, ingredient.getKey()));
                    }

                }

            });

            if (_.isArray(this.groupOrder)) {
                this._groups = _.sortBy(this._groups, (group:RecipeGroup) => _.indexOf(this.groupOrder, group.getKey()));
            }
        }

    }

    public updateGroupSorting():void {
        _.each(this._groups, (group:RecipeGroup) => {
            group.updateSort();
        });
        this.groupOrder = _.map<RecipeGroup, string>(this._groups, 'groupId');
    }

    private assignToGroup(entity:Direction|RecipeIngredient, groupId:string):void {

        let group = _.find(this._groups, {groupId: groupId});

        if (!group) {
            throw new SpiraException(`Could not find group to assign entity to. Group id given: ${groupId}`);
        }

        if (entity instanceof Direction) {
            group.__directions.push(entity);
        }

        if (entity instanceof RecipeIngredient) {
            group.__ingredients.push(entity);
        }

    }

    public isLinkedTo(item:Meal|MealPlan):boolean {

        let keyName:string = '_pivot.' + item.getKeyName();

        return _.get(this, keyName) === item.getKey();
    }
}

applyMixins(Recipe, [SectionableModel, LocalizableModel, PublishableModel]);