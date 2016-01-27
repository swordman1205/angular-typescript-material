import * as _ from "lodash";
import SpiraException from "../../../exceptions";
import RecipeIngredient from "../recipe/recipeIngredientModel";

export type TUnitType = 'metric'|'imperial'|'measures';
export const METRIC_TYPE:TUnitType = 'metric';
export const IMPERIAL_TYPE:TUnitType = 'imperial';
export const MEASURES_TYPE:TUnitType = 'measures';

export interface ITypeDefinition {
    conversion:number;
    maxCount:number;
    name:string;
    roundingOptions:number[];
}

export interface ITypeConversion {
    name:string;
    fraction:number
    roundedTotal:number;
    inaccuracy:number;
}

export interface IRoundedValues {
    metric:IUnitConversion<IUnitMeasureTypeMetricWeight, IUnitMeasureTypeMetricVolume>;
    imperial:IUnitConversion<IUnitMeasureTypeImperialWeight, IUnitMeasureTypeImperialVolume>;
    measures:IUnitConversion<IUnitMeasureTypeMeasuresWeight, IUnitMeasureTypeMeasuresVolume>;
    recipe:IUnitMeasure;
    unrounded:IUnrounded;
}

export interface IUnitConversion<W, V> {
    name:TUnitType;
    weight:W;
    volume:V;
}

export interface IUnrounded {
    grams:number;
    millilitres:number;
}

export interface IUnitMeasureTypeMetricWeight extends IUnitMeasureTypeWeight {
    grams:IUnitMeasure;
    kilograms:IUnitMeasure;
}

export interface IUnitMeasureTypeMetricVolume extends IUnitMeasureTypeVolume {
    millilitres:IUnitMeasure;
    litres:IUnitMeasure;
}

export interface IUnitMeasureTypeImperialWeight extends IUnitMeasureTypeWeight {
    ounces:IUnitMeasure;
    pounds:IUnitMeasure;
}

export interface IUnitMeasureTypeImperialVolume extends IUnitMeasureTypeVolume {
    fluidOunces:IUnitMeasure;
    gallons:IUnitMeasure;
}

export interface IUnitMeasureTypeMeasuresVolume extends IUnitMeasureTypeVolume {
    teaspoons:IUnitMeasure;
    tablespoons:IUnitMeasure;
    cups:IUnitMeasure;
}

export interface IUnitMeasureTypeMeasuresWeight extends IUnitMeasureTypeWeight {
    teaspoons:IUnitMeasure;
    tablespoons:IUnitMeasure;
    cups:IUnitMeasure;
}

export interface IUnitMeasureTypeMeasures extends IUnitMeasureTypeMeasuresVolume, IUnitMeasureTypeMeasuresWeight {
}

export interface IUnitMeasureTypeWeight {
    pinch:IUnitMeasure;
}

export interface IUnitMeasureTypeVolume {
    drop:IUnitMeasure;
}

export interface IUnitMeasure {
    amount:number;
    amountType:string;
}

export class UnitConversionException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'UnitConversionException';
    }
}

export const MILLILITRES_PER_CUP:number = 250;
export const TEASPOONS_IN_CUP:number = 50;
export const TEASPOONS_IN_TABLESPOON:number = 3;

export default class UnitConversion {

    // The % inaccuracy allowed in unit simplification, i.e. If 1.25 gallons is within 10%
    // inaccuracy of a conversion value it will be chosen over a measurement in gallons and fluid ounces.
    private static unitSimplificationAllowance:number = 0.1; // As a fraction, i.e. 0.1 = 10% inaccuracy.

    // If the % inaccuracy of rounding to imperial units exceeds the imperialRoundingthreshold, the measurement
    // will be rounded exactly and given in 1 significant figure.
    private static imperialRoundingthreshold:number = 0.3;

    public static weightTypes:string[] = ['grams', 'kilograms', 'small', 'medium', 'large'];

    // Cup, Tablespoon and Teaspoon mapping
    public static cupTypeMap:ITypeDefinition[] = [
        {name: 'cups', roundingOptions: [1 / 4, 1 / 3], conversion: 250, maxCount: null},
        {name: 'tablespoons', roundingOptions: [1 / 2], conversion: 15, maxCount: 4},
        {name: 'teaspoons', roundingOptions: [1 / 4], conversion: 5, maxCount: 4},
    ];

    // Gallons and Fluid Ounces mapping
    public static imperialVolumeMap:ITypeDefinition[] = [
        {name: 'gallons', roundingOptions: [1 / 4], conversion: 3785.41, maxCount: null},
        {name: 'fluidOunces', roundingOptions: [1 / 4], conversion: 29.5735, maxCount: null},
    ];

    // Pounds and Ounces mapping
    public static imperialWeightMap:ITypeDefinition[] = [
        {name: 'pounds', roundingOptions: [1 / 4], conversion: 453.592, maxCount: null},
        {name: 'ounces', roundingOptions: [1 / 4], conversion: 28.3495, maxCount: null},
    ];

    // Default rounded results
    public static roundedValuesDefault:IRoundedValues = {
        metric: {
            name: METRIC_TYPE,
            weight: {
                kilograms: {
                    amount: 0, amountType: 'kilograms'
                },
                grams: {
                    amount: 0, amountType: 'grams'
                },
                pinch: {
                    amount: 0, amountType: 'pinch'
                }
            },
            volume: {
                litres: {
                    amount: 0, amountType: 'litres'
                },
                millilitres: {
                    amount: 0, amountType: 'millilitres'
                },
                drop: {
                    amount: 0, amountType: 'drop'
                }
            }
        },
        imperial: {
            name: IMPERIAL_TYPE,
            weight: {
                pounds: {
                    amount: 0, amountType: 'pounds'
                },
                ounces: {
                    amount: 0, amountType: 'ounces'
                },
                pinch: {
                    amount: 0, amountType: 'pinch'
                }
            },
            volume: {
                gallons: { // US Gallon
                    amount: 0, amountType: 'gallons'
                },
                fluidOunces: { // US Fluid Ounce
                    amount: 0, amountType: 'fluidOunces'
                },
                drop: {
                    amount: 0, amountType: 'drop'
                }
            }
        },
        measures: {
            name: MEASURES_TYPE,
            weight: {
                cups: {
                    amount: 0, amountType: 'cups'
                },
                tablespoons: {
                    amount: 0, amountType: 'tablespoons'
                },
                teaspoons: {
                    amount: 0, amountType: 'teaspoons'
                },
                pinch: {
                    amount: 0, amountType: 'pinch'
                }
            },
            volume: {
                cups: {
                    amount: 0, amountType: 'cups'
                },
                tablespoons: {
                    amount: 0, amountType: 'tablespoons'
                },
                teaspoons: {
                    amount: 0, amountType: 'teaspoons'
                },
                drop: {
                    amount: 0, amountType: 'drop'
                }
            }
        },
        recipe: {
            amount: 0,
            amountType: null
        },
        unrounded: {
            grams: 0,
            millilitres: 0
        }
    };

    // Base Units
    private unroundedGrams:number = 0;
    private unroundedMillilitres:number = 0;

    // Ingredient specific constants
    private gramsPerCup:number = undefined;
    private gramsInSmall:number = undefined;
    private gramsInMedium:number = undefined;
    private gramsInLarge:number = undefined;

    // The rounded values
    private roundedValues = _.cloneDeep(UnitConversion.roundedValuesDefault);

    /**
     * Adds the input amount to unrounded values.
     * @param amount
     * @param type
     * @returns {UnitConversion}
     */
    public addInput(amount:number, type:string):UnitConversion {
        if (amount > 0) {
            this.addToBase(amount, type);
        }

        return this;
    }

    /**
     * Reset all conversions and settings.
     */
    public reset():UnitConversion {
        this.unroundedGrams = 0;
        this.unroundedMillilitres = 0;
        this.gramsPerCup = undefined;
        this.gramsInSmall = undefined;
        this.gramsInMedium = undefined;
        this.gramsInLarge = undefined;
        this.roundedValues = _.cloneDeep(UnitConversion.roundedValuesDefault);

        return this;
    }

    /**
     * Helper method to load ingredient details.
     * @param recipeIngredient
     * @returns {UnitConversion}
     */
    public setIngredient(recipeIngredient:RecipeIngredient):UnitConversion {

        this.setGramsPerCup(recipeIngredient.gramsPerCup);
        this.setGramsInSmall(recipeIngredient.smallStandardWeight);
        this.setGramsInMedium(recipeIngredient.mediumStandardWeight);
        this.setGramsInLarge(recipeIngredient.largeStandardWeight);
        this.setRecipeValues(recipeIngredient);

        return this;
    }

    /**
     * Set Recipe values for an ingredient.
     * @param recipeIngredient
     * @returns {UnitConversion}
     */
    public setRecipeValues(recipeIngredient:RecipeIngredient):UnitConversion {

        this.roundedValues.recipe.amount = recipeIngredient._pivot.amount;
        if (_.includes(['small', 'medium', 'large'], recipeIngredient._pivot.amountType) && recipeIngredient.unitName) {
            this.roundedValues.recipe.amountType = recipeIngredient.unitName;
        }
        else {
            this.roundedValues.recipe.amountType = recipeIngredient._pivot.amountType;
        }

        return this;
    }

    /**
     * Set the grams per cup constant of an ingredient.
     * @param grams
     * @returns {UnitConversion}
     */
    public setGramsPerCup(grams:number = undefined):UnitConversion {

        this.gramsPerCup = grams;

        return this;

    }

    /**
     * Set the grams per small unit of an ingredient.
     * @param grams
     * @returns {UnitConversion}
     */
    public setGramsInSmall(grams:number = undefined):UnitConversion {

        this.gramsInSmall = grams;

        return this;

    }

    /**
     * Set the grams per medium unit of an ingredient.
     * @param grams
     * @returns {UnitConversion}
     */
    public setGramsInMedium(grams:number = undefined):UnitConversion {

        this.gramsInMedium = grams;

        return this;

    }

    /**
     * Set the grams per large unit of an ingredient.
     * @param grams
     * @returns {UnitConversion}
     */
    public setGramsInLarge(grams:number = undefined):UnitConversion {

        this.gramsInLarge = grams;

        return this;

    }

    /**
     * Return metric weight converted and rounded values.
     * @returns {IUnitMeasureTypeMetricWeight}
     */
    public toMetricWeight():IUnitMeasureTypeMetricWeight {

        this.convertAndRoundMetricWeight();

        return this.roundedValues.metric.weight;

    }

    /**
     * Return metric volume converted and rounded values.
     * @returns {IUnitMeasureTypeMetricVolume}
     */
    public toMetricVolume():IUnitMeasureTypeMetricVolume {

        this.convertAndRoundMetricVolume();

        return this.roundedValues.metric.volume;

    }

    /**
     * Return imperial weight converted and rounded values.
     * @returns {IUnitMeasureTypeImperialWeight}
     */
    public toImperialWeight():IUnitMeasureTypeImperialWeight {

        this.convertAndRoundImperialWeight();

        return this.roundedValues.imperial.weight;

    }

    /**
     * Return imperial volume converted and rounded values.
     * @returns {IUnitMeasureTypeImperialVolume}
     */
    public toImperialVolume():IUnitMeasureTypeImperialVolume {

        this.convertAndRoundImperialVolume();

        return this.roundedValues.imperial.volume;

    }

    /**
     * Return measures converted and rounded values.
     * @returns {IUnitMeasureTypeMeasures}
     */
    public toMeasures():IUnitMeasureTypeMeasures {

        this.convertAndRoundMeasures();

        return (<IUnitMeasureTypeMeasures>_.merge(this.roundedValues.measures.weight, this.roundedValues.measures.volume));

    }

    /**
     * Returns units and amount as entered into the recipe.
     * @returns {IUnitMeasure}
     */
    public toRecipe():IUnitMeasure {

        return this.roundedValues.recipe;
    }

    /**
     * Return all converted and rounded values.
     */
    public toAll():IRoundedValues {

        this.convertAndRoundMetricWeight();
        this.convertAndRoundMetricVolume();
        this.convertAndRoundImperialWeight();
        this.convertAndRoundImperialVolume();
        this.convertAndRoundMeasures();

        return this.roundedValues;

    }

    private convertPinch(amount:number) {
        let roundedAmount = Math.round(amount);

        this.roundedValues.metric.weight.pinch.amount = roundedAmount;
        this.roundedValues.imperial.weight.pinch.amount = roundedAmount;
        this.roundedValues.measures.weight.pinch.amount = roundedAmount;
    }

    private convertDrop(amount:number) {
        let roundedAmount = Math.round(amount);

        this.roundedValues.metric.volume.drop.amount = roundedAmount;
        this.roundedValues.imperial.volume.drop.amount = roundedAmount;
        this.roundedValues.measures.volume.drop.amount = roundedAmount;
    }

    /**
     * Convert and add to base units (gram and millilitre).
     * @param amount
     * @param type
     */
    private addToBase(amount, type) {
        switch (type) {
            case('pinch'):
                this.convertPinch(amount);
                break;

            case('drop'):
                this.convertDrop(amount);
                break;

            case('grams'):
                this.unroundedGrams += amount;
                break;

            case('kilograms'):
                this.unroundedGrams += amount * 1000;
                break;

            case('millilitres'):
                this.unroundedMillilitres += amount;
                break;

            case('litres'):
                this.unroundedMillilitres += amount * 1000;
                break;
            case('small'):
                if (!_.isNumber(this.gramsInSmall)) {
                    throw new UnitConversionException('Grams in small measurement not set.');
                }
                this.unroundedGrams += this.gramsInSmall * amount;
                break;

            case('medium'):
                if (!_.isNumber(this.gramsInMedium)) {
                    throw new UnitConversionException('Grams in medium measurement not set.');
                }
                this.unroundedGrams += this.gramsInMedium * amount;
                break;

            case('large'):
                if (!_.isNumber(this.gramsInLarge)) {
                    throw new UnitConversionException('Grams in large measurement not set.');
                }
                this.unroundedGrams += this.gramsInLarge * amount;
                break;

            case('teaspoons'):
                this.unroundedMillilitres += (amount / TEASPOONS_IN_CUP) * MILLILITRES_PER_CUP;
                break;

            case('tablespoons'):
                this.unroundedMillilitres += (amount / (TEASPOONS_IN_CUP / TEASPOONS_IN_TABLESPOON)) * MILLILITRES_PER_CUP;
                break;

            case('cups'):
                this.unroundedMillilitres += amount * MILLILITRES_PER_CUP;
                break;

            default:
                throw new UnitConversionException('Invalid conversion type! (`' + type + ' given`)');

        }

        if (_.isNumber(this.gramsPerCup)) {
            if (_.includes(UnitConversion.weightTypes, type)) {
                this.unroundedMillilitres += (this.unroundedGrams / this.gramsPerCup) * MILLILITRES_PER_CUP;
            }
            else {
                this.unroundedGrams += (this.unroundedMillilitres / MILLILITRES_PER_CUP) * this.gramsPerCup;
            }
        }

    }

    private convertAndRoundMetricWeight() {

        this.roundedValues.unrounded.grams = this.unroundedGrams;

        let kilogramAmount = this.unroundedGrams / 1000;

        if (kilogramAmount > 1) {
            this.roundedValues.metric.weight.kilograms.amount = Number(kilogramAmount.toPrecision(2));
        }
        else if (this.unroundedGrams < 100) {
            this.roundedValues.metric.weight.grams.amount = Number(this.unroundedGrams.toPrecision(2));
        }
        else {
            this.roundedValues.metric.weight.grams.amount = _.round(this.unroundedGrams);
        }

    }

    private convertAndRoundMetricVolume() {

        this.roundedValues.unrounded.millilitres = this.unroundedMillilitres;

        let litreAmount = this.unroundedMillilitres / 1000;

        if (litreAmount > 1) {
            this.roundedValues.metric.volume.litres.amount = Number(litreAmount.toPrecision(2));
        }
        else if (this.unroundedMillilitres < 100) {
            this.roundedValues.metric.volume.millilitres.amount = Number(this.unroundedMillilitres.toPrecision(2));
        }
        else {
            this.roundedValues.metric.volume.millilitres.amount = _.round(this.unroundedMillilitres);
        }

    }

    private convertAndRoundImperialWeight() {

        let results:ITypeConversion[] = this.convertAndRoundImperialUnits(this.unroundedGrams, UnitConversion.imperialWeightMap);

        _.forEach(results, (result) => {

            this.roundedValues.imperial.weight[result.name].amount = result.roundedTotal;

        }, this);

    }

    private convertAndRoundImperialVolume() {

        let results:ITypeConversion[] = this.convertAndRoundImperialUnits(this.unroundedMillilitres, UnitConversion.imperialVolumeMap);

        _.forEach(results, (result) => {

            this.roundedValues.imperial.volume[result.name].amount = result.roundedTotal;

        }, this);

    }

    private convertAndRoundMeasures():void {

        let result:ITypeConversion;

        if (this.unroundedMillilitres > 0) {
            result = this.convertMeasures(this.unroundedMillilitres);
        }
        else {
            return;
        }

        this.roundedValues.measures.volume[result.name].amount = result.roundedTotal;

        if (this.gramsPerCup) {
            this.roundedValues.measures.weight[result.name].amount = result.roundedTotal;
        }

        if (this.gramsInSmall) {

        }

    }

    private convertAndRoundImperialUnits(amount:number, mappings:ITypeDefinition[]):ITypeConversion[] {

        let results:ITypeConversion[] = [];

        _.forEach(mappings, (map, key) => {

            // Figure out the best fraction of this particular unit
            let unitAmountRounding:ITypeConversion = _.reduce(map.roundingOptions, (bestResult:ITypeConversion, roundingOption:number) => {

                let unroundedConversion = amount / map.conversion;

                let currentAmount = (Math.round(unroundedConversion / roundingOption) * roundingOption);

                if (currentAmount > 10) {
                    // We don't use current amount here because we could end up rounding up too much, this assumes
                    // that whole units will always be a valid measure.
                    // E.g. unroundedConversion = 13.45, Number(currentAmount.toPrecision(2)) = 14;
                    currentAmount = Number(unroundedConversion.toPrecision(2));
                }

                let returnObject:ITypeConversion = {
                    name: map.name,
                    fraction: roundingOption,
                    roundedTotal: currentAmount,
                    inaccuracy: Math.abs(1 - (currentAmount * map.conversion) / amount)
                };

                if (!bestResult) {
                    return returnObject;
                }

                if (returnObject.inaccuracy < bestResult.inaccuracy) {
                    return returnObject;
                }

                return bestResult;

            }, null);

            if (key == mappings.length - 1) { // Smallest Unit, take our amount if it's under the imperialRoundingthreshold

                if (unitAmountRounding.inaccuracy < UnitConversion.imperialRoundingthreshold) {

                    results.push(unitAmountRounding);

                }
                else { // Just round to 1SF

                    let roundedTotal = Number((amount / map.conversion).toPrecision(1));

                    results.push({
                        name: map.name,
                        fraction: 1 / 10,
                        roundedTotal: roundedTotal,
                        inaccuracy: Math.abs(1 - (roundedTotal * map.conversion) / amount)
                    });

                }

            }
            else if (unitAmountRounding.inaccuracy < UnitConversion.unitSimplificationAllowance) {
                // Answer is acceptable, let's take it

                results.push(unitAmountRounding);

                return false;

            }
            else { // We still have a unit smaller than the one we're on, get whole units

                let roundedTotal = Math.floor(amount / map.conversion);

                if (roundedTotal > 0) {
                    results.push({
                        name: map.name,
                        fraction: 1,
                        roundedTotal: roundedTotal,
                        inaccuracy: 0
                    });
                }

                amount -= roundedTotal * map.conversion;

            }

        });

        return results;

    }

    private convertMeasures(millilitres:number):ITypeConversion {

        return _.reduce(UnitConversion.cupTypeMap, (bestResult:ITypeConversion, currentCupTypeDefinition:ITypeDefinition):ITypeConversion => {

            return _.reduce(currentCupTypeDefinition.roundingOptions, (currentBest:ITypeConversion, roundingOption:number):ITypeConversion => {

                let currentCount:number = Math.round((millilitres / currentCupTypeDefinition.conversion) / roundingOption);
                let roundedTotal = _.round(currentCount * roundingOption, 2);
                let returnObject:ITypeConversion = {
                    name: currentCupTypeDefinition.name,
                    fraction: roundingOption,
                    roundedTotal: roundedTotal,
                    inaccuracy: Math.abs(1 - (roundedTotal * currentCupTypeDefinition.conversion) / millilitres),
                };

                //if we don't have a best result yet, set it to current
                if (!currentBest) {
                    return returnObject;
                }

                if ((!currentCupTypeDefinition.maxCount || roundedTotal <= currentCupTypeDefinition.maxCount) && returnObject.inaccuracy < currentBest.inaccuracy) {
                    return returnObject;
                }

                //otherwise, the best is unchanged
                return currentBest;

            }, bestResult);

        }, null);
    }

    public static testConvertMeasures() {

        let unitConversion = new UnitConversion();

        let test = _.chain(1)
            .range(500, 1)
            .map((mlValue) => {

                let result = unitConversion.reset().convertMeasures(mlValue);

                return {
                    millilitres: mlValue,
                    measure: `${result.roundedTotal} ${result.name}`,
                    size: result.fraction,
                    unit: result.name,
                    inaccuracy: result.inaccuracy * 100 + '%',
                }
            })
            .value();

        (<any>console).table(test);

    }

    public static testConvertImperialVolume() {

        (new UnitConversion()).testConvertImperial(UnitConversion.imperialVolumeMap);

    }

    public static testConvertImperialWeight() {

        (new UnitConversion()).testConvertImperial(UnitConversion.imperialWeightMap);
    }

    private testConvertImperial(map:ITypeDefinition[]) {

        let test = _.chain(1)
            .range(750, 1)
            .map((value) => {

                let result = this.reset().convertAndRoundImperialUnits(value, map);
                let measure = '';
                let inaccuracy = 0;

                _.forEach(result, (unit) => {
                    measure = measure + unit.roundedTotal + ' ' + unit.name + ' ';
                    inaccuracy += unit.inaccuracy;
                });

                return {
                    value: value,
                    measure: measure,
                    inaccuracy: inaccuracy * 100 + '%',
                }
            })
            .value();

        (<any>console).table(test);

    }

    public static testGraphWeight() {

        (new UnitConversion()).testGraph(UnitConversion.imperialWeightMap);

    }

    public static testGraphVolume() {

        (new UnitConversion()).testGraph(UnitConversion.imperialVolumeMap, 1100);

    }

    private testGraph(map:ITypeDefinition[], range:number = 750) {

        let results = _.chain(1)
            .range(range, 1)
            .map((value) => {

                let measuresResult = this.reset().convertMeasures(value);
                let imperialResult = this.reset().convertAndRoundImperialUnits(value, map);

                let imperialMeasure = '';
                let imperialInaccuracy = 0;

                _.forEach(imperialResult, (unit) => {
                    imperialMeasure = imperialMeasure + unit.roundedTotal + ' ' + unit.name + ' ';
                    imperialInaccuracy += unit.inaccuracy;
                });

                imperialMeasure = imperialMeasure.substring(0, imperialMeasure.length - 1);

                return [
                    value,
                    measuresResult.inaccuracy * 100,
                    measuresResult.roundedTotal + ' ' + measuresResult.name,
                    value,
                    imperialInaccuracy * 100,
                    imperialMeasure
                ]
            })
            .value();

        let csvContent = ['Value (mL)', 'Measure Inaccuracy (%)', 'Measure', 'Value (mL/g)', 'Imperial Inaccuracy (%)', 'Imperial'].join('\t') + '\n';

        _.forEach(results, (result) => {
            csvContent += (<string[]>result).join('\t') + '\n';
        });

        console.log(csvContent);

    }

}

