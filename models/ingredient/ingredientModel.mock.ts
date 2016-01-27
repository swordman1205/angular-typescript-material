import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Ingredient from "./ingredientModel";
export default class IngredientMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Ingredient;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let measureByWeight = seededChance.bool();
        let cupSpoonMeasuresEnabled = seededChance.bool();
        let unitCountsEnabled = seededChance.bool();

        return {
            ingredientId: seededChance.guid(),
            name: seededChance.word(),
            approvedBy: seededChance.bool() ? seededChance.guid() : undefined,
            measuredBy: measureByWeight ? Ingredient.measuredByWeight : Ingredient.measuredByVolume,
            cupSpoonMeasuresEnabled: measureByWeight ? cupSpoonMeasuresEnabled : undefined,
            gramsPerCup: measureByWeight && cupSpoonMeasuresEnabled ? seededChance.integer({
                min: 30,
                max: 400
            }) : undefined,
            unitCountsEnabled: measureByWeight ? unitCountsEnabled : undefined,
            unitName: measureByWeight && unitCountsEnabled ? seededChance.word() : undefined,
            smallStandardWeight: measureByWeight && unitCountsEnabled ? seededChance.integer({
                min: 30,
                max: 400
            }) : undefined,
            mediumStandardWeight: measureByWeight && unitCountsEnabled ? seededChance.integer({
                min: 30,
                max: 400
            }) : undefined,
            largeStandardWeight: measureByWeight && unitCountsEnabled ? seededChance.integer({
                min: 30,
                max: 400
            }) : undefined,
            _tags: [],
            _localizations: [],
            _dietaryRestrictions: [],
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Ingredient {
        return <Ingredient> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):Ingredient[] {
        return <Ingredient[]>new this().buildCollection(count);
    }

}

