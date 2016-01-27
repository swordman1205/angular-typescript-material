import * as _ from "lodash";
import {expect} from "../../../testBootstrap.spec";
import UnitConversion, {UnitConversionException} from "./unitConversion";
import RecipeIngredientMock from "../recipe/recipeIngredientModel.mock";
import RecipeIngredient from "../recipe/recipeIngredientModel";

describe('Unit Conversion Model', () => {

    describe('Initialization', () => {

        it('should instantiate a new unit conversion', () => {

            let unitConversion = new UnitConversion();

            expect(unitConversion).to.be.instanceOf(UnitConversion);

        });

        it('should be able to set gramsPerCup', () => {

            let unitConversion = new UnitConversion();

            unitConversion.setGramsPerCup(614);

            expect((<any>unitConversion).gramsPerCup).to.equal(614);

        });

        it('should be able to set small standard weight', () => {

            let unitConversion = new UnitConversion();

            unitConversion.setGramsInSmall(552);

            expect((<any>unitConversion).gramsInSmall).to.equal(552);

        });

        it('should be able to set medium standard weight', () => {

            let unitConversion = new UnitConversion();

            unitConversion.setGramsInMedium(286);

            expect((<any>unitConversion).gramsInMedium).to.equal(286);

        });

        it('should be able to set large standard weight', () => {

            let unitConversion = new UnitConversion();

            unitConversion.setGramsInLarge(53);

            expect((<any>unitConversion).gramsInLarge).to.equal(53);

        });

        it('should be able to set the ingredient', () => {

            let unitConversion = new UnitConversion();
            let recipeIngredient = RecipeIngredientMock.entity();

            unitConversion.setIngredient(recipeIngredient);

            expect((<any>unitConversion).gramsPerCup).to.equal(recipeIngredient.gramsPerCup);
            expect((<any>unitConversion).gramsInSmall).to.equal(recipeIngredient.smallStandardWeight);
            expect((<any>unitConversion).gramsInMedium).to.equal(recipeIngredient.mediumStandardWeight);
            expect((<any>unitConversion).gramsInLarge).to.equal(recipeIngredient.largeStandardWeight);

        });

        it('should be able to set recipe values', () => {

            let unitConversion = new UnitConversion();
            let recipeIngredient = RecipeIngredientMock.entity({
                unitName: null
            });

            unitConversion.setRecipeValues(recipeIngredient);

            expect((<any>unitConversion).roundedValues.recipe.amount).to.equal(recipeIngredient._pivot.amount);
            expect((<any>unitConversion).roundedValues.recipe.amountType).to.equal(recipeIngredient._pivot.amountType);

        });

        it('should be able to set recipe values with unitName', () => {

            let unitConversion = new UnitConversion();
            let recipeIngredient = RecipeIngredientMock.entity({
                unitName: 'foobar'
            });
            recipeIngredient._pivot.amountType = 'medium';

            unitConversion.setRecipeValues(recipeIngredient);

            expect((<any>unitConversion).roundedValues.recipe.amount).to.equal(recipeIngredient._pivot.amount);
            expect((<any>unitConversion).roundedValues.recipe.amountType).to.equal(recipeIngredient.unitName);

        });

        it('should not set recipe values with unitName if the amount type isn\'t a size type', () => {

            let unitConversion = new UnitConversion();
            let recipeIngredient = RecipeIngredientMock.entity({
                unitName: 'foobar'
            });
            recipeIngredient._pivot.amountType = 'cups';

            unitConversion.setRecipeValues(recipeIngredient);

            expect((<any>unitConversion).roundedValues.recipe.amount).to.equal(recipeIngredient._pivot.amount);
            expect((<any>unitConversion).roundedValues.recipe.amountType).to.equal(recipeIngredient._pivot.amountType);

        });

    });

    describe('Exception cases', () => {

        it('should throw an exception when an invalid conversion type is entered', () => {

            let unitConversion = new UnitConversion();

            let testInvalidConvertTypeFn = () => {
                unitConversion.addInput(1, 'foobar');
            };

            expect(testInvalidConvertTypeFn).to.throw(UnitConversionException);

        });

        describe('Invalid Ingredient', () => {

            it('should throw an exception when a small weight type attempts to be converted without a smallStandardWeight parameter', () => {

                let unitConversion = new UnitConversion();

                let testInvalidIngredientFn = () => {
                    unitConversion.addInput(1, 'small');
                };

                expect(testInvalidIngredientFn).to.throw(UnitConversionException);

            });

            it('should throw an exception when a medium weight type attempts to be converted without a mediumStandardWeight parameter', () => {

                let unitConversion = new UnitConversion();

                let testInvalidIngredientFn = () => {
                    unitConversion.addInput(1, 'medium');
                };

                expect(testInvalidIngredientFn).to.throw(UnitConversionException);

            });

            it('should throw an exception when a large weight type attempts to be converted without a largeStandardWeight parameter', () => {

                let unitConversion = new UnitConversion();

                let testInvalidIngredientFn = () => {
                    unitConversion.addInput(1, 'large');
                };

                expect(testInvalidIngredientFn).to.throw(UnitConversionException);

            });

        });

    });

    describe('Functionality', () => {

        it('should be able to set all conversions to 0 when reset has been called', () => {

            let unitConversion = new UnitConversion();
            let recipeIngredient = RecipeIngredientMock.entity({
                measuredBy: RecipeIngredient.measuredByVolume
            });

            unitConversion.setIngredient(recipeIngredient).addInput(500, 'millilitres').toAll();

            expect((<any>unitConversion).roundedValues.imperial.volume.fluidOunces.amount).to.be.greaterThan(0);

            unitConversion.reset();

            expect((<any>unitConversion).roundedValues).to.deep.equal(UnitConversion.roundedValuesDefault);

        });

        it('should be able to cumulatively add more inputs', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(100, 'grams').toMetricWeight();

            expect(results.grams.amount).to.equal(100);

            results = unitConversion.addInput(0.75, 'kilograms').toMetricWeight();

            expect(results.grams.amount).to.equal(850);

        });

    });

    describe('Output Types', () => {

        it('should be able to output metric weights', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(1.25, 'kilograms').toMetricWeight();

            expect(results).to.include.keys('kilograms');
            expect(results).to.include.keys('grams');
            expect(results).to.include.keys('pinch');

        });

        it('should be able to output metric volume', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(4.25, 'cups').toMetricVolume();

            expect(results).to.include.keys('litres');
            expect(results).to.include.keys('millilitres');
            expect(results).to.include.keys('drop');

        });

        it('should be able to output imperial weights', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(1417.48, 'grams').toImperialWeight();

            expect(results).to.include.keys('pounds');
            expect(results).to.include.keys('ounces');
            expect(results).to.include.keys('pinch');

        });

        it('should be able to output imperial volume', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(1, 'litres').toImperialVolume();

            expect(results).to.include.keys('gallons');
            expect(results).to.include.keys('fluidOunces');
            expect(results).to.include.keys('drop');

        });

        it('should be able to output measures', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.addInput(270, 'millilitres').toMeasures();

            expect(results).to.include.keys('cups');
            expect(results).to.include.keys('tablespoons');
            expect(results).to.include.keys('teaspoons');
            expect(results).to.include.keys('pinch');
            expect(results).to.include.keys('drop');

        });

        it('should be able to output to all types', () => {

            let unitConversion = new UnitConversion();

            let results = unitConversion.setGramsPerCup(250).addInput(250, 'grams').toAll();

            expect(results.metric).to.include.keys('weight');
            expect(results.metric).to.include.keys('volume');
            expect(results.imperial).to.include.keys('weight');
            expect(results.imperial).to.include.keys('volume');
            expect(results.measures).to.include.keys('weight');
            expect(results.measures).to.include.keys('volume');

        });

    });

    describe('Conversions', () => {

        let unitConversion:UnitConversion;

        // Need to set the maps in case they change in the future.
        let testCupMap = [
                {name: 'cups', roundingOptions: [1 / 4, 1 / 3], conversion: 250, maxCount: null},
                {name: 'tablespoons', roundingOptions: [1 / 2], conversion: 15, maxCount: 4},
                {name: 'teaspoons', roundingOptions: [1 / 4], conversion: 5, maxCount: 4},
            ],
            testImperialVolumeMap = [
                {name: 'gallons', roundingOptions: [1 / 4], conversion: 3785.41, maxCount: null},
                {name: 'fluidOunces', roundingOptions: [1 / 4], conversion: 29.5735, maxCount: null},
            ],
            testImperialWeightMap = [
                {name: 'pounds', roundingOptions: [1 / 4, 1 / 3], conversion: 453.592, maxCount: null},
                {name: 'ounces', roundingOptions: [1 / 4], conversion: 28.3495, maxCount: null},
            ];

        // Need to set the thresholds in case they change
        (<any>UnitConversion).imperialRoundingthreshold = 0.3;

        (<any>UnitConversion).unitSimplificationAllowance = 0.1;

        beforeEach(() => {

            // Set conversion values used by UnitConversion
            UnitConversion.cupTypeMap = testCupMap;
            UnitConversion.imperialVolumeMap = testImperialVolumeMap;
            UnitConversion.imperialWeightMap = testImperialWeightMap;

            unitConversion = new UnitConversion();

        });

        it('should be able to handle a pinch type', () => {

            let results = unitConversion.addInput(2.1, 'pinch').toAll();

            expect(results.metric.weight.pinch.amount).to.equal(2, 'metric');

            expect(results.imperial.weight.pinch.amount).to.equal(2, 'imperial');

            expect(results.measures.weight.pinch.amount).to.equal(2, 'measures');

        });

        it('should be able to handle a drop type', () => {

            let results = unitConversion.addInput(3.1, 'drop').toAll();

            expect(results.metric.volume.drop.amount).to.equal(3, 'metric');

            expect(results.imperial.volume.drop.amount).to.equal(3, 'imperial');

            expect(results.measures.volume.drop.amount).to.equal(3, 'measures');

        });

        it('should be able to convert and round grams', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 564
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(3210, 'grams').toAll();

            expect(results.unrounded.grams).to.equal(3210, 'unrounded grams (1)');
            expect(_.round(results.unrounded.millilitres)).to.equal(1423, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(3.2, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(1.4, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(0, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(7, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(48, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(5.67, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(243.3, 'grams').toAll();

            expect(results.unrounded.grams).to.equal(243.3, 'unrounded grams (2)');
            expect(_.round(results.unrounded.millilitres)).to.equal(108, 'unrounded millilitres (2)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (2)');
            expect(results.metric.weight.grams.amount).to.equal(243, 'grams (2)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (2)');
            expect(results.metric.volume.millilitres.amount).to.equal(108, 'millilitres (2)');

            expect(results.imperial.weight.pounds.amount).to.equal(0.5, 'pounds (2)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (2)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (2)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(3.75, 'fluidOunces (2)');

            expect(results.measures.volume.cups.amount).to.equal(0.5, 'cups (2)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (2)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (2)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(1, 'grams').toAll();

            expect(results.unrounded.grams).to.equal(1, 'unrounded grams (3)');
            expect(_.round(results.unrounded.millilitres, 2)).to.equal(0.44, 'unrounded millilitres (3)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (3)');
            expect(results.metric.weight.grams.amount).to.equal(1, 'grams (3)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (3)');
            expect(results.metric.volume.millilitres.amount).to.equal(0.44, 'millilitres (3)');

            expect(results.imperial.weight.pounds.amount).to.equal(0, 'pounds (3)');
            expect(results.imperial.weight.ounces.amount).to.equal(0.04, 'ounces (3)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (3)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(0.01, 'fluidOunces (3)');

            expect(results.measures.volume.cups.amount).to.equal(0, 'cups (3)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (3)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (3)');
        });

        it('should be able to convert and round kilograms', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 300
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(1.054, 'kilograms').toAll();

            expect(results.unrounded.grams).to.equal(1054, 'unrounded grams');
            expect(_.round(results.unrounded.millilitres)).to.equal(878, 'unrounded millilitres');

            expect(results.metric.weight.kilograms.amount).to.equal(1.1, 'kilograms');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres');
            expect(results.metric.volume.millilitres.amount).to.equal(878, 'millilitres');

            expect(results.imperial.weight.pounds.amount.toFixed(3)).to.equal('2.333', 'pounds');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces');

            expect(results.imperial.volume.gallons.amount).to.equal(0.25, 'gallons');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(0, 'fluidOunces');

            expect(results.measures.volume.cups.amount).to.equal(3.5, 'cups');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons');

        });

        it('should not convert a weight to cups if gramsPerCup is not set', () => {

            let results = unitConversion.addInput(500, 'grams').toAll();

            expect(results.measures.volume.cups.amount).to.equal(0, 'cups');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons');

        });

        it('should be able to convert and round millilitres', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 350
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(1264, 'millilitres').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(1770, 'unrounded grams (1)');
            expect(results.unrounded.millilitres).to.equal(1264, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(1.8, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(1.3, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(0, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(4, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(43, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(5, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(147, 'millilitres').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(206, 'unrounded grams (2)');
            expect(results.unrounded.millilitres).to.equal(147, 'unrounded millilitres (2)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (2)');
            expect(results.metric.weight.grams.amount).to.equal(206, 'grams (2)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (2)');
            expect(results.metric.volume.millilitres.amount).to.equal(147, 'millilitres (2)');

            expect(results.imperial.weight.pounds.amount).to.equal(0, 'pounds (2)');
            expect(results.imperial.weight.ounces.amount).to.equal(7.25, 'ounces (2)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (2)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(5, 'fluidOunces (2)');

            expect(results.measures.volume.cups.amount).to.equal(0.67, 'cups (2)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (2)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (2)');

        });

        it('should be able to convert and round litres', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 621
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(2.456, 'litres').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(6101, 'unrounded grams');
            expect(results.unrounded.millilitres).to.equal(2456, 'unrounded millilitres');

            expect(results.metric.weight.kilograms.amount).to.equal(6.1, 'kilograms');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams');

            expect(results.metric.volume.litres.amount).to.equal(2.5, 'litres');
            expect(results.metric.volume.millilitres.amount).to.equal(0, 'millilitres');

            expect(results.imperial.weight.pounds.amount).to.equal(13, 'pounds');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(83, 'fluidOunces');

            expect(results.measures.volume.cups.amount).to.equal(9.75, 'cups');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons');

        });

        it('should be able to convert and round small counts', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 250,
                smallStandardWeight: 175
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(10, 'small').toAll();

            expect(results.unrounded.grams).to.equal(1750, 'unrounded grams (1)');
            expect(results.unrounded.millilitres).to.equal(1750, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(1.8, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(1.8, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(0, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(3.75, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0.5, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(0, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(7, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(0.5, 'small').toAll();

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (2)');
            expect(results.metric.weight.grams.amount).to.equal(88, 'grams (2)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (2)');
            expect(results.metric.volume.millilitres.amount).to.equal(88, 'millilitres (2)');

            expect(results.imperial.weight.pounds.amount).to.equal(0, 'pounds (2)');
            expect(results.imperial.weight.ounces.amount).to.equal(3, 'ounces (2)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (2)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(3, 'fluidOunces (2)');

            expect(results.measures.volume.cups.amount).to.equal(0.33, 'cups (2)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (2)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (2)');

        });

        it('should be able to convert and round medium counts', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 777,
                mediumStandardWeight: 222
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(2, 'medium').toAll();

            expect(results.unrounded.grams).to.equal(444, 'unrounded grams');
            expect(_.round(results.unrounded.millilitres)).to.equal(143, 'unrounded millilitres');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms');
            expect(results.metric.weight.grams.amount).to.equal(444, 'grams');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres');
            expect(results.metric.volume.millilitres.amount).to.equal(143, 'millilitres');

            expect(results.imperial.weight.pounds.amount).to.equal(1, 'pounds');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(4.75, 'fluidOunces');

            expect(results.measures.volume.cups.amount).to.equal(0.5, 'cups');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons');

        });

        it('should be able to convert and round large counts', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                largeStandardWeight: 750,
                gramsPerCup: 111
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(1.5, 'large').toAll();

            expect(results.unrounded.grams).to.equal(1125, 'unrounded grams');
            expect(_.round(results.unrounded.millilitres)).to.equal(2534, 'unrounded millilitres');

            expect(results.metric.weight.kilograms.amount).to.equal(1.1, 'kilograms');
            expect(results.metric.weight.grams.amount).to.equal(0, 'grams');

            expect(results.metric.volume.litres.amount).to.equal(2.5, 'litres');
            expect(results.metric.volume.millilitres.amount).to.equal(0, 'millilitres');

            expect(results.imperial.weight.pounds.amount).to.equal(2.5, 'pounds');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(86, 'fluidOunces');

            expect(results.measures.volume.cups.amount).to.equal(10.25, 'cups');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons');

        });

        it('should be able to convert and round cups', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 333
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(1.5, 'cups').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(500, 'unrounded grams (1)');
            expect(results.unrounded.millilitres).to.equal(375, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(500, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(375, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(1, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(13, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(1.5, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(1.01, 'cups').toAll();

            expect(results.measures.volume.cups.amount).to.equal(1, 'cups (2)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (2)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (2)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(0.245, 'cups').toAll();

            expect(results.measures.volume.cups.amount).to.equal(0.25, 'cups (3)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (3)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (3)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(0.244, 'cups').toAll();

            expect(results.measures.volume.cups.amount).to.equal(0, 'cups (4)');
            expect(results.measures.volume.tablespoons.amount).to.equal(4, 'tablespoons (4)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (4)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(1.70999, 'cups').toAll();

            expect(results.measures.volume.cups.amount).to.equal(1.67, 'cups (5)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (5)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (5)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(1.71, 'cups').toAll();

            expect(results.measures.volume.cups.amount).to.equal(1.75, 'cups (6)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (6)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (6)');

        });

        it('should be able to convert and round tablespoons', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 400,
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(3.1, 'tablespoons').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(74, 'unrounded grams (1)');
            expect(results.unrounded.millilitres).to.equal(46.5, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(74, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(47, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(0, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(2.5, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(1.5, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(0, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(3, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

            results = unitConversion.reset().setIngredient(recipeIngredient).addInput(20.64, 'tablespoons').toAll();

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (2)');
            expect(results.metric.weight.grams.amount).to.equal(495, 'grams (2)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (2)');
            expect(results.metric.volume.millilitres.amount).to.equal(310, 'millilitres (2)');

            expect(results.imperial.weight.pounds.amount).to.equal(1, 'pounds (2)');
            expect(results.imperial.weight.ounces.amount).to.equal(0, 'ounces (2)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (2)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(10, 'fluidOunces (2)');

            expect(results.measures.volume.cups.amount).to.equal(1.25, 'cups (2)');
            expect(results.measures.volume.tablespoons.amount).to.equal(0, 'tablespoons (2)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (2)');

        });

        it('should be able to convert and round teaspoons', () => {

            let recipeIngredient = RecipeIngredientMock.entity({
                gramsPerCup: 101,
            });

            let results = unitConversion.setIngredient(recipeIngredient).addInput(3.1, 'teaspoons').toAll();

            expect(_.round(results.unrounded.grams)).to.equal(6, 'unrounded grams (1)');
            expect(results.unrounded.millilitres).to.equal(15.5, 'unrounded millilitres (1)');

            expect(results.metric.weight.kilograms.amount).to.equal(0, 'kilograms (1)');
            expect(results.metric.weight.grams.amount).to.equal(6.3, 'grams (1)');

            expect(results.metric.volume.litres.amount).to.equal(0, 'litres (1)');
            expect(results.metric.volume.millilitres.amount).to.equal(16, 'millilitres (1)');

            expect(results.imperial.weight.pounds.amount).to.equal(0, 'pounds (1)');
            expect(results.imperial.weight.ounces.amount).to.equal(0.25, 'ounces (1)');

            expect(results.imperial.volume.gallons.amount).to.equal(0, 'gallons (1)');
            expect(results.imperial.volume.fluidOunces.amount).to.equal(0.5, 'fluidOunces (1)');

            expect(results.measures.volume.cups.amount).to.equal(0, 'cups (1)');
            expect(results.measures.volume.tablespoons.amount).to.equal(1, 'tablespoons (1)');
            expect(results.measures.volume.teaspoons.amount).to.equal(0, 'teaspoons (1)');

        });

    });

});

