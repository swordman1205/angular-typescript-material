import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import RecipeIngredient from "../../models/recipe/recipeIngredientModel";
import {
    IngredientDisplayController,
    IngredientDisplayException,
    THREE_QUARTER_CHAR,
    HALF_CHAR,
    QUARTER_CHAR,
    TWO_THIRDS_CHAR,
    THIRD_CHAR
} from "./ingredientDisplay";
import RecipeIngredientMock from "../../models/recipe/recipeIngredientModel.mock";
import UnitConversion, {
    IMPERIAL_TYPE,
    METRIC_TYPE,
    MEASURES_TYPE,
    MILLILITRES_PER_CUP
} from "../../models/unitConversion/unitConversion";
import Ingredient from "../../models/ingredient/ingredientModel";
import {ISupportedRegion, default as RegionService} from "../../services/region/regionService";
import {namespace as programRecipe} from "../../../app/program/programItem/recipe/recipe";
import {namespace as program} from "../../../app/program/program";
import {namespace as admin} from "../../../app/admin/admin";
import {namespace as adminRecipe} from "../../../app/admin/recipes/recipe/recipe";

interface TestScope extends ng.IRootScopeService {
    testRecipeIngredient:RecipeIngredient;
    testMeasurementSystem:string;
    testMeasuresEnabled:boolean;
    testWatchIngredient:boolean;
    testIncludeDescription:boolean;
    testShowApproxMediumCounts:boolean;
    testShowAsOnRecipe:boolean;
    IngredientDisplayController:IngredientDisplayController;
}

describe('Ingredient display directive', () => {

    let gramsInOunce = 10,
        gramsInPound = 1000,
        millilitresPerTeaspoon = 5,
        millilitresPerFluidOunce = 40,
        testCupMap = [
            {name: 'cups', roundingOptions: [1 / 4, 1 / 3], conversion: 250, maxCount: null},
            {name: 'tablespoons', roundingOptions: [1 / 2], conversion: 15, maxCount: 4},
            {name: 'teaspoons', roundingOptions: [1 / 4], conversion: millilitresPerTeaspoon, maxCount: 4},
        ],
        testImperialVolumeMap = [
            {name: 'gallons', roundingOptions: [1 / 4], conversion: 3785.41, maxCount: null},
            {name: 'fluidOunces', roundingOptions: [1 / 4], conversion: millilitresPerFluidOunce, maxCount: null},
        ],
        testImperialWeightMap = [
            {name: 'pounds', roundingOptions: [1 / 4], conversion: gramsInPound, maxCount: null},
            {name: 'ounces', roundingOptions: [1 / 4], conversion: gramsInOunce, maxCount: null},
        ],
        testImperialRoundingthreshold = 0.3,
        testUnitSimplificationAllowance = 0.1,
        testUnitTypes = {
            pinch: {
                fractionize: false,
                type: {singular: 'pinch', plural: 'pinches'}
            },
            drop: {
                fractionize: false,
                type: {singular: 'drop', plural: 'drops'},
            },
            kilograms: {
                fractionize: false,
                type: 'kg',
            },
            grams: {
                fractionize: false,
                type: 'g',
            },
            litres: {
                fractionize: false,
                type: 'L',
            },
            millilitres: {
                fractionize: false,
                type: 'mL',
            },
            pounds: {
                fractionize: true,
                type: {singular: 'lb', plural: 'lbs'},
            },
            ounces: {
                fractionize: true,
                type: 'oz',
            },
            gallons: {
                fractionize: true,
                type: 'Gal',
            },
            fluidOunces: {
                fractionize: true,
                type: 'fl oz',
            },
            cups: {
                fractionize: true,
                type: {singular: 'cup', plural: 'cups'},
            },
            tablespoons: {
                fractionize: true,
                type: 'tbsp',
            },
            teaspoons: {
                fractionize: true,
                type: 'tsp'
            },
            small: {
                fractionize: true,
                type: 'small'
            },
            medium: {
                fractionize: true,
                type: 'medium'
            },
            large: {
                fractionize: true,
                type: 'large'
            }
        };

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:IngredientDisplayController,
        $q:ng.IQService,
        regionService:RegionService,
        recipeIngredient:RecipeIngredient,
        $log:ng.ILogService,
        $state:ng.ui.IStateService;

    let initDirective = (recipeIngredient:RecipeIngredient,
                         region:ISupportedRegion = null,
                         measurementSystem:string = null,
                         measuresEnabled:boolean = null,
                         watchIngredient:boolean = null,
                         includeDescription:boolean = null,
                         showAsOnRecipe:boolean = null,
                         showApproxMediumCounts:boolean = null) => {
        directiveScope = <TestScope>$rootScope.$new();

        directiveScope.testRecipeIngredient = recipeIngredient;

        regionService.currentRegion = region;

        let templateHtml = '<ingredient-display recipe-ingredient="testRecipeIngredient"';

        if (!_.isNull(measurementSystem)) {
            directiveScope.testMeasurementSystem = measurementSystem;

            templateHtml += ' measurement-system="{{ testMeasurementSystem }}"';
        }

        if (!_.isNull(measuresEnabled)) {
            directiveScope.testMeasuresEnabled = measuresEnabled;

            templateHtml += ' measures-enabled="testMeasuresEnabled"';
        }

        if (!_.isNull(watchIngredient)) {
            directiveScope.testWatchIngredient = watchIngredient;

            templateHtml += ' watch-ingredient="testWatchIngredient"';
        }

        if (!_.isNull(includeDescription)) {
            directiveScope.testIncludeDescription = includeDescription;

            templateHtml += ' include-description="testIncludeDescription"';
        }

        if (!_.isNull(showAsOnRecipe)) {
            directiveScope.testShowAsOnRecipe = showAsOnRecipe;

            templateHtml += ' show-as-on-recipe="testShowAsOnRecipe"';
        }

        if (!_.isNull(showApproxMediumCounts)) {
            directiveScope.testShowApproxMediumCounts = showApproxMediumCounts;

            templateHtml += ' show-approx-medium-counts="testShowApproxMediumCounts"';
        }

        templateHtml += '></ingredient-display>';

        compiledElement = $compile(templateHtml)(directiveScope);

        $rootScope.$digest();

        directiveController = (<TestScope>compiledElement.isolateScope()).IngredientDisplayController;
    };

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_, _regionService_, _$log_, _$state_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            regionService = _regionService_;
            $log = _$log_;
            $state = _$state_;
        });

        // Set mocks for log
        (<any>$log).error = sinon.stub();

        // Set mocks for state
        $state.go = sinon.stub();

        // Set to null before each and create using initDirective()
        directiveController = null;

        // Create a new recipeIngredient
        recipeIngredient = RecipeIngredientMock.entity();

        // Set conversion values used by UnitConversion
        UnitConversion.cupTypeMap = testCupMap;
        UnitConversion.imperialVolumeMap = testImperialVolumeMap;
        UnitConversion.imperialWeightMap = testImperialWeightMap;

        // Set Unit Conversion thresholds
        (<any>UnitConversion).imperialRoundingthreshold = testImperialRoundingthreshold;

        (<any>UnitConversion).unitSimplificationAllowance = testUnitSimplificationAllowance;

        // Set the unitTypes
        (<any>IngredientDisplayController).unitTypes = testUnitTypes;
    });

    describe('Initialization', () => {

        it('should initialise the directive with correct defaults', () => {

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[2] // US Region
            );

            expect($(compiledElement).hasClass('ingredient-display-directive')).to.be.true;

            expect(directiveController.recipeIngredient).to.deep.equal(recipeIngredient);
            expect(directiveController.measurementSystem).to.equal(IMPERIAL_TYPE);
            expect(directiveController.measuresEnabled).to.equal(false);
            expect(directiveController.watchIngredient).to.equal(undefined);
            expect(directiveController.includeDescription).to.equal(false);
            expect(directiveController.showApproxMediumCounts).to.equal(false);
            expect(directiveController.showAsOnRecipe).to.equal(false);

        });

        it('should fall back to metric measurement system if a region cannot be determined', () => {

            initDirective(
                recipeIngredient
            );

            expect(directiveController.measurementSystem).to.equal(METRIC_TYPE);

        });

        it('should throw an exception on invalid measurement system', () => {

            let failingFunction = () => initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                'foobar'
            );

            expect(failingFunction).to.throw(IngredientDisplayException);

        });

    });

    describe('Display Ingredient', () => {

        it('display should be invalid if the amount is 0 or undefined', () => {

            recipeIngredient._pivot.amount = 0;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0]
            );

            expect(directiveController.display.valid).to.be.false;

            expect($log.error).to.be.calledWith('No amount defined for ingredient ' + recipeIngredient.getName(), recipeIngredient);

            recipeIngredient._pivot.amount = undefined;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0]
            );

            expect(directiveController.display.valid).to.be.false;

            expect($log.error).to.be.calledWith('No amount defined for ingredient ' + recipeIngredient.getName(), recipeIngredient);

        });

        it('should not convert where the ingredient does not allow it to be', () => {

            recipeIngredient.cupSpoonMeasuresEnabled = false;
            recipeIngredient.gramsPerCup = undefined;
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient._pivot.amountType = 'grams';

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                MEASURES_TYPE
            );

            expect(directiveController.display.valid).to.be.false;

            expect($log.error).to.be.calledWith('Display not valid for ingredient ' + recipeIngredient.getName(), recipeIngredient);
        });

        it('should be able to perform a simple conversion', () => {

            recipeIngredient._pivot.amount = gramsInOunce;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['ounces'].type,
                        amount: "1"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

        it('should be able to show approximately how many medium counts', () => {

            recipeIngredient._pivot.amount = 250;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.mediumStandardWeight = 100;
            recipeIngredient.unitCountsEnabled = true;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                METRIC_TYPE,
                null,
                null,
                null,
                null,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['grams'].type,
                        amount: "250"
                    }
                ],
                valid: true,
                approxMedium: 3
            };

            expect(directiveController.display).to.deep.equal(expectation);

            expect($($($(compiledElement).children()[0].children[0]).children()[2]).hasClass('approx-medium')).to.be.true;

        });

        it('should not show approximately medium counts if the recipe isn\'t set up that way', () => {

            recipeIngredient._pivot.amount = 250;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.mediumStandardWeight = null;
            recipeIngredient.unitCountsEnabled = false;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                METRIC_TYPE,
                null,
                null,
                null,
                null,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['grams'].type,
                        amount: "250"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

    });

    describe('Measures Enabled', () => {

        it('should convert to measures if measures are enabled', () => {

            recipeIngredient._pivot.amount = MILLILITRES_PER_CUP;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.cupSpoonMeasuresEnabled = true;
            recipeIngredient.gramsPerCup = MILLILITRES_PER_CUP;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                METRIC_TYPE,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['cups'].type['singular'],
                        amount: "1"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should fall back to another system if measures cannot be converted to', () => {

            recipeIngredient._pivot.amount = gramsInOunce;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.cupSpoonMeasuresEnabled = false;
            recipeIngredient.gramsPerCup = undefined;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['ounces'].type,
                        amount: "1"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

    });

    describe('Watchers', () => {

        it('should be able to enable watch and update display', () => {

            recipeIngredient._pivot.amount = gramsInOunce;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE,
                false,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['ounces'].type,
                        amount: "1"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

            recipeIngredient._pivot.amount = gramsInOunce * 2;

            $rootScope.$digest();

            expectation.unitAmounts[0].amount = "2";
            expect(directiveController.display).to.deep.equal(expectation);

            recipeIngredient._pivot.amount = gramsInPound;

            $rootScope.$digest();

            expectation.unitAmounts[0].amount = "1";
            expectation.unitAmounts[0].unit = testUnitTypes['pounds'].type.singular;
            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should update the display when measurement types have changed', () => {

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE, // Measurement system
                false, // Measures enabled
                true
            );

            sinon.spy(directiveController, 'updateDisplay');

            $rootScope.$digest();

            directiveController.measuresEnabled = true;

            $rootScope.$digest();

            expect(directiveController.updateDisplay).to.be.called;

            directiveController.measurementSystem = METRIC_TYPE;

            $rootScope.$digest();

            expect(directiveController.updateDisplay).to.be.called;

            (<any>directiveController.updateDisplay).restore();

        });

    });

    describe('Formatting and Rounding', () => {

        it('should be able to display double units where applicable', () => {

            recipeIngredient._pivot.amount = gramsInPound + (12 * gramsInOunce);
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.singular,
                        amount: "1"
                    },
                    {
                        unit: testUnitTypes['ounces'].type,
                        amount: "12"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should not display fractions where it is not set to', () => {

            recipeIngredient._pivot.amount = 5.5;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                METRIC_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['grams'].type,
                        amount: "5.5"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should be able to format to singular', () => {

            recipeIngredient._pivot.amount = gramsInPound;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.singular,
                        amount: "1"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should be able to format to a plural', () => {

            recipeIngredient._pivot.amount = gramsInPound * 2;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.plural,
                        amount: "2"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

        it('should not use a symbol if there is none available', () => {

            recipeIngredient._pivot.amount = millilitresPerFluidOunce * 0.37;
            recipeIngredient._pivot.amountType = 'millilitres';
            recipeIngredient.measuredBy = Ingredient.measuredByVolume;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['fluidOunces'].type,
                        amount: "0.4"
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should be able to format using a 1/4 symbol', () => {

            recipeIngredient._pivot.amount = gramsInPound / 4;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.singular,
                        amount: QUARTER_CHAR
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should be able to format using a 1/2 symbol', () => {

            recipeIngredient._pivot.amount = gramsInPound / 2;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.singular,
                        amount: HALF_CHAR
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

        it('should be able to format using a 3/4 symbol', () => {

            recipeIngredient._pivot.amount = (gramsInPound * 3) / 4;
            recipeIngredient._pivot.amountType = 'grams';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['pounds'].type.singular,
                        amount: THREE_QUARTER_CHAR
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

        it('should be able to format using a 1/3 symbol', () => {

            recipeIngredient._pivot.amount = MILLILITRES_PER_CUP / 3;
            recipeIngredient._pivot.amountType = 'millilitres';
            recipeIngredient.measuredBy = Ingredient.measuredByVolume;
            recipeIngredient.cupSpoonMeasuresEnabled = true;
            recipeIngredient.gramsPerCup = MILLILITRES_PER_CUP;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                MEASURES_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['cups'].type.singular,
                        amount: THIRD_CHAR
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

        it('should be able to format using a 2/3 symbol', () => {

            recipeIngredient._pivot.amount = (2 * MILLILITRES_PER_CUP) / 3;
            recipeIngredient._pivot.amountType = 'millilitres';
            recipeIngredient.measuredBy = Ingredient.measuredByVolume;
            recipeIngredient.cupSpoonMeasuresEnabled = true;
            recipeIngredient.gramsPerCup = MILLILITRES_PER_CUP;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                MEASURES_TYPE
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: testUnitTypes['cups'].type.singular,
                        amount: TWO_THIRDS_CHAR
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);
        });

        it('should be able to format a custom ingredient type', () => {

            recipeIngredient._pivot.amount = 4;
            recipeIngredient._pivot.amountType = 'medium';
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.mediumStandardWeight = 100;
            recipeIngredient.unitCountsEnabled = true;
            recipeIngredient.unitName = 'foobar';

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE,
                null,
                null,
                null,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: 'foobar',
                        amount: '4'
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

    });

    describe('Recipe Ingredient Descriptions', () => {

        it('should be able to display the recipe ingredient descriptions', () => {

            initDirective(
                recipeIngredient
            );

            expect($($(compiledElement).children()[0].children[1]).hasClass('ingredient-description')).to.be.false;

            initDirective(
                recipeIngredient,
                null,
                null,
                null,
                null,
                true
            );

            expect($($(compiledElement).children()[0].children[1]).hasClass('ingredient-description')).to.be.true;

        });

    });

    describe('Show as on Recipe', () => {

        it('should be able to display the ingredient as entered in on the recipe', () => {

            recipeIngredient._pivot.amount = 4;
            recipeIngredient._pivot.amountType = 'medium';
            recipeIngredient.unitName = null;
            recipeIngredient.measuredBy = Ingredient.measuredByWeight;
            recipeIngredient.mediumStandardWeight = 100;
            recipeIngredient.unitCountsEnabled = true;

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0],
                IMPERIAL_TYPE,
                null,
                null,
                null,
                true
            );

            let expectation = {
                ingredient: recipeIngredient,
                ingredientName: recipeIngredient.getName(),
                unitAmounts: [
                    {
                        unit: 'medium',
                        amount: '4'
                    }
                ],
                valid: true,
                approxMedium: 0
            };

            expect(directiveController.display).to.deep.equal(expectation);

        });

    });

    describe('Ingredient is Recipe', () => {

        it('should be able to navigate to a recipe from program', () => {

            recipeIngredient.recipeId = 'foobar';

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0]
            );

            (<any>directiveController).$state.current.name = program;
            directiveController.goToRecipe();

            expect($state.go).to.be.calledWith(programRecipe, {
                permalink: 'foobar'
            });

        });

        it('should be able to navigate to a recipe from admin', () => {

            recipeIngredient.recipeId = 'barfoo';

            initDirective(
                recipeIngredient,
                regionService.supportedRegions[0]
            );

            (<any>directiveController).$state.current.name = admin;
            directiveController.goToRecipe();

            expect($state.go).to.be.calledWith(adminRecipe, {
                id: 'barfoo'
            });

        });

    });

});

