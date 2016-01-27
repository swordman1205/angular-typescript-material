import {expect, seededChance} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import Recipe from "./recipeModel";
import RecipeGroup from "./recipeGroupModel";
import RecipeIngredient from "./recipeIngredientModel";
import RecipeIngredientMock from "./recipeIngredientModel.mock";
import DirectionMock from "../direction/directionModel.mock";
import Direction from "../direction/directionModel";
import SpiraException from "../../../exceptions";

describe('Recipe Model', () => {

    it('should instantiate a new recipe', () => {

        let recipe = new Recipe({
            title: 'foobar'
        });

        expect(recipe).to.be.instanceOf(Recipe);

    });

    it('should get the recipe identifier as id if there is no permalink', () => {

        let recipe = new Recipe({
            title: 'foobar',
            permalink: null,
        });

        expect(recipe.getIdentifier()).to.equal(recipe.getKey());

    });

    it('should get the recipe identifier as permalink if there is a permalink', () => {

        let recipe = new Recipe({
            title: 'foobar',
            permalink: 'some-permalink',
        });

        expect(recipe.getIdentifier()).to.equal(recipe.permalink);

    });

    describe('Ingredient & Direction grouping', () => {

        it('should allocate ingredients & directions to groups, and sort them when hydrated', () => {

            let recipeId:string = seededChance.guid();

            let group1 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let ingredients = _.map(RecipeIngredientMock.collection(2), (recipeIngredient:RecipeIngredient) => {
                recipeIngredient._pivot.groupId = group1.getKey();
                return recipeIngredient;
            });

            let directions = _.map(DirectionMock.collection(2), (direction:Direction) => {
                direction.groupId = group1.getKey();
                return direction;
            });

            group1.entityOrder = {
                ingredients: _.map<RecipeIngredient, string>(ingredients, 'ingredientId').reverse(),
                directions: _.map<Direction, string>(directions, 'directionId').reverse(),
            };

            let groupResetSpy = sinon.spy(group1, 'reset');

            let group2 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let groups = [group1, group2];

            let recipe = new Recipe({
                recipeId: recipeId,
                _groups: groups,
                _ingredients: ingredients,
                _directions: directions,
                groupOrder: _.map(groups, 'groupId').reverse(),
            });

            expect(_.first(recipe._groups).getKey()).to.equal(group2.getKey()); //the reverse sorting should have moved it to first position

            let lastGroup = _.last(recipe._groups);

            expect(lastGroup.__directions).to.be.an.instanceOf(Array);
            expect(_.first(lastGroup.__directions).getKey()).to.equal(_.first(lastGroup.entityOrder.directions));

            expect(lastGroup.__ingredients).to.be.an.instanceOf(Array);
            expect(_.first(lastGroup.__ingredients).getKey()).to.equal(_.first(lastGroup.entityOrder.ingredients));

            expect(groupResetSpy).to.have.been.calledOnce;

            groupResetSpy.restore();

        });

        it('should throw exception when an ingredient or direction cannot be assigned to a group in the recipe', () => {

            let invalidFn = () => {

                let recipeId:string = seededChance.guid();

                let group1 = new RecipeGroup({
                    groupId: seededChance.guid(),
                    recipeId: recipeId,
                });

                let directions = _.map(DirectionMock.collection(2), (direction:Direction) => {
                    direction.groupId = seededChance.guid(); //this will never be the same as the group
                    return direction;
                });

                new Recipe({
                    recipeId: recipeId,
                    _groups: [group1],
                    _directions: directions,
                });

            };

            expect(invalidFn).to.throw(SpiraException);

        });

        it('should be able to allocate ingredients & directions to groups, and skip the sorting', () => {

            let recipeId:string = seededChance.guid();

            let group1 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let ingredients:RecipeIngredient[] = _.map(RecipeIngredientMock.collection(2), (recipeIngredient:RecipeIngredient) => {
                recipeIngredient._pivot.groupId = group1.getKey();
                return recipeIngredient;
            });

            let directions:Direction[] = _.map(DirectionMock.collection(2), (direction:Direction) => {
                direction.groupId = group1.getKey();
                return direction;
            });

            group1.entityOrder = {
                ingredients: _.map<RecipeIngredient, string>(ingredients, 'ingredientId').reverse(),
                directions: _.map<Direction, string>(directions, 'directionId').reverse(),
            };

            let group2 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let groups = [group1, group2];

            let recipe = new Recipe({
                recipeId: recipeId,
            });

            recipe._groups = groups;
            recipe._ingredients = ingredients;
            recipe._directions = directions;
            recipe.groupOrder = _.map<RecipeGroup, string>(groups, 'groupId').reverse();

            recipe.updateGroups(false);

            expect(_.first(recipe._groups).getKey()).to.equal(group1.getKey()); //the reverse sorting should not have applied

            let firstGroup = _.first(recipe._groups);

            expect(firstGroup.__directions).to.be.an.instanceOf(Array);
            expect(_.first(firstGroup.__directions).getKey()).to.equal(_.first(directions).getKey());

            expect(firstGroup.__ingredients).to.be.an.instanceOf(Array);
            expect(_.first(firstGroup.__ingredients).getKey()).to.equal(_.first(ingredients).getKey());

        });

        it('should be able to update the group sorting properties', () => {

            let recipeId:string = seededChance.guid();

            let group1 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let ingredients:RecipeIngredient[] = _.map(RecipeIngredientMock.collection(2), (recipeIngredient:RecipeIngredient) => {
                recipeIngredient._pivot.groupId = group1.getKey();
                return recipeIngredient;
            });

            let directions:Direction[] = _.map(DirectionMock.collection(2), (direction:Direction) => {
                direction.groupId = group1.getKey();
                return direction;
            });

            group1.entityOrder = {
                ingredients: _.map<RecipeIngredient, string>(ingredients, 'ingredientId').reverse(),
                directions: _.map<Direction, string>(directions, 'directionId').reverse(),
            };

            let group2 = new RecipeGroup({
                groupId: seededChance.guid(),
                recipeId: recipeId,
            });

            let groups = [group1, group2];

            let recipe = new Recipe({
                recipeId: recipeId,
            });

            recipe._groups = groups;
            recipe._ingredients = ingredients;
            recipe._directions = directions;
            recipe.groupOrder = _.map<RecipeGroup, string>(groups, 'groupId').reverse();

            recipe.updateGroups(false);
            recipe.updateGroupSorting();

            expect(_.first(recipe._groups).getKey()).to.equal(_.first(recipe.groupOrder));

            let firstGroup = _.first(recipe._groups);

            expect(_.first(firstGroup.__directions).getKey()).to.equal(_.first(_.first(recipe._groups).entityOrder.directions));

            expect(_.first(firstGroup.__ingredients).getKey()).to.equal(_.first(_.first(recipe._groups).entityOrder.ingredients));

        });

    });

});

