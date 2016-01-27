import * as _ from "lodash";
import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Recipe, {DIFFICULTY_HARD, DIFFICULTY_EASY, DIFFICULTY_MEDIUM} from "./recipeModel";
import RecipeGroupMock from "./recipeGroupModel.mock";
import RecipeIngredient from "./recipeIngredientModel";
import RecipeIngredientMock from "./recipeIngredientModel.mock";
import Direction from "../direction/directionModel";
import DirectionMock from "../direction/directionModel.mock";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export default class RecipeMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Recipe;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let recipeId = seededChance.guid();

        let groups = RecipeGroupMock.collection(2, {
            recipeId: recipeId,
        });

        let ingredients = _.flatten([
            this.seedIngredientsWithGroup(groups[0].groupId),
            this.seedIngredientsWithGroup(groups[1].groupId),
        ]);

        let directions = _.flatten([
            this.seedDirectionsWithGroup(groups[0].groupId),
            this.seedDirectionsWithGroup(groups[1].groupId),
        ]);

        return {
            recipeId: recipeId,
            sourceId: null,
            title: seededChance.word(),
            shortTitle: seededChance.word(),
            permalink: seededChance.url(),
            thumbnailImageId: seededChance.guid(),
            draft: seededChance.bool(),
            authorId: seededChance.guid(),
            groupOrder: [],
            prepTime: moment.duration(seededChance.hammertime()),
            cookTime: moment.duration(seededChance.hammertime()),
            addedSugarTsps: seededChance.integer({min: 0, max: 6}),
            difficulty: seededChance.pick([
                DIFFICULTY_HARD,
                DIFFICULTY_MEDIUM,
                DIFFICULTY_EASY
            ]),
            _tags: [],
            _ingredients: ingredients,
            _directions: directions,
            _groups: groups,
            _localizations: [],
        };

    }

    private seedIngredientsWithGroup(groupId:string):RecipeIngredient[] {

        let seededChance = new Chance();

        return _.map(RecipeIngredientMock.collection(seededChance.integer({
            min: 2,
            max: 5
        })), (recipeIngredient:RecipeIngredient) => {
            recipeIngredient._pivot.groupId = groupId;
            return recipeIngredient;
        });

    };

    private seedDirectionsWithGroup(groupId:string):Direction[] {

        let seededChance = new Chance();

        return DirectionMock.collection(seededChance.integer({min: 2, max: 5}), {
            groupId: groupId,
        });

    };

    public static entity(overrides:Object = {}, exists:boolean = true):Recipe {
        return <Recipe> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):Recipe[] {
        return <Recipe[]>new this().buildCollection(count);
    }

}

