import * as angular from "angular";
import * as _ from "lodash";
import Ingredient from "../../models/ingredient/ingredientModel";
import SpiraException from "../../../exceptions";
import RecipeIngredient from "../../models/recipe/recipeIngredientModel";
import {
    METRIC_TYPE,
    IMPERIAL_TYPE,
    MEASURES_TYPE,
    IRoundedValues,
    default as UnitConversion,
    IUnitMeasure
} from "../../models/unitConversion/unitConversion";
import RegionService from "../../services/region/regionService";
import {namespace as programRecipe} from "../../../app/program/programItem/recipe/recipe";
import {namespace as program} from "../../../app/program/program";
import {namespace as admin} from "../../../app/admin/admin";
import {namespace as adminRecipe} from "../../../app/admin/recipes/recipe/recipe";

export const namespace = 'common.directives.ingredientDisplay';

export interface IUnitTypes {
    [key:string]:IUnitType;
}

export interface IUnitType {
    fractionize:boolean;
    type:(string|IPluralType);
}

export interface IPluralType {
    plural:string;
    singular:string;
}

export interface IUnitAmount {
    unit:string;
    amount:string;
}

export interface IIngredientDisplayFormat {
    ingredient:Ingredient;
    ingredientName:string;
    unitAmounts:IUnitAmount[];
    valid:boolean;
    approxMedium:number;
}

export class IngredientDisplayException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'IngredientDisplayException';
    }
}

export const QUARTER_CHAR:string = '&frac14;';
export const HALF_CHAR:string = '&frac12;';
export const THREE_QUARTER_CHAR:string = '&frac34;';
export const THIRD_CHAR:string = '&#8531;';
export const TWO_THIRDS_CHAR:string = '&#8532;';

export class IngredientDisplayController {

    private static unitTypes:IUnitTypes = {
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

    public display:IIngredientDisplayFormat;

    public recipeIngredient:RecipeIngredient;

    // Set by region by default. Either metric, imperial or measures.
    public measurementSystem:string;

    // False by default. If true, will watch for changes in recipeIngredient.
    public watchIngredient:boolean;

    public linkIngredient:boolean;

    // False by default. If true, will convert everything to measures where applicable. Falls
    // back to measurementSystem when the ingredient cannot be converted.
    public measuresEnabled:boolean;

    // False by default. If true, will include the recipe's description (from _pivot)
    public includeDescription:boolean;

    // False by default. If true, will show the amount/unit as entered into the recipe.
    public showAsOnRecipe:boolean;

    // False by default. If true, will show approx how many medium counts (if counts have been enabled on ingredient)
    public showApproxMediumCounts:boolean;

    static $inject = ['regionService', '$scope', '$log', '$state'];

    constructor(private regionService:RegionService,
                private $scope:ng.IScope,
                private $log:ng.ILogService,
                private $state:ng.ui.IStateService) {
        if (!_.isString(this.measurementSystem)) { // Get conversion type depending on region
            if (this.regionService.currentRegion) {
                this.measurementSystem = _.find(regionService.supportedRegions, {code: this.regionService.currentRegion.code}).conversion;
            } else { // Set an output type based on region
                this.measurementSystem = METRIC_TYPE; // Fall back to metric
            }
        }
        else if (!_.includes([METRIC_TYPE, IMPERIAL_TYPE, MEASURES_TYPE], this.measurementSystem)) {
            throw new IngredientDisplayException("Measurement system must either be 'metric', 'imperial' or 'measures'.");
        }

        if (!_.isBoolean(this.measuresEnabled)) {
            this.measuresEnabled = false;
        }

        if (!_.isBoolean(this.includeDescription)) {
            this.includeDescription = false;
        }

        if (!_.isBoolean(this.showAsOnRecipe)) {
            this.showAsOnRecipe = false;
        }

        if (!_.isBoolean(this.showApproxMediumCounts)) {
            this.showApproxMediumCounts = false;
        }

        if (this.watchIngredient) {
            this.$scope.$watch(() => this.recipeIngredient, (newValue, oldValue) => {
                if (!_.isEqual(newValue, oldValue)) {
                    this.updateDisplay();
                }
            }, true); // Have to check for object equality as we need to know if _pivot data changes.
        }

        // Set watchers on unit measurement types and update if they change
        this.$scope.$watch(() => this.measuresEnabled, (newValue, oldValue) => {
            if (!_.isEqual(newValue, oldValue)) {
                this.updateDisplay();
            }
        });

        this.$scope.$watch(() => this.measurementSystem, (newValue, oldValue) => {
            if (!_.isEqual(newValue, oldValue)) {
                this.updateDisplay();
            }
        });

        this.$scope.$watch(() => this.showAsOnRecipe, (newValue, oldValue) => {
            if (!_.isEqual(newValue, oldValue)) {
                this.updateDisplay();
            }
        });

        this.updateDisplay();
    }

    public goToRecipe():void {

        if (this.$state.current.name.indexOf(program) > -1) {
            this.$state.go(programRecipe, {
                permalink: this.recipeIngredient.recipeId
            });
        }
        else if (this.$state.current.name.indexOf(admin) > -1) {
            this.$state.go(adminRecipe, {
                id: this.recipeIngredient.recipeId
            });
        }

        // @Todo: Add in public states
    }

    public updateDisplay():void {
        this.display = {
            ingredient: this.recipeIngredient,
            ingredientName: this.recipeIngredient.getName(),
            unitAmounts: [],
            valid: false,
            approxMedium: 0
        };

        if (_.isUndefined(this.recipeIngredient._pivot.amount) || this.recipeIngredient._pivot.amount == 0) {
            this.$log.error('No amount defined for ingredient ' + this.recipeIngredient.getName(), this.recipeIngredient);
            return;
        }

        let convertedValues:IRoundedValues = (new UnitConversion()).setIngredient(this.recipeIngredient).addInput(this.recipeIngredient._pivot.amount, this.recipeIngredient._pivot.amountType).toAll();

        if (this.showAsOnRecipe) {
            this.display.unitAmounts.push(this.formatAmount(convertedValues.recipe.amount, convertedValues.recipe.amountType));
            this.display.valid = true;
        }
        else {
            // Get the output display type.
            let typeToDisplay = this.measurementSystem;
            let measuredBy = this.recipeIngredient.measuredBy;
            if (this.recipeIngredient.cupSpoonMeasuresEnabled && this.measuresEnabled) {
                typeToDisplay = MEASURES_TYPE;
            }

            _.forEach(convertedValues[typeToDisplay][measuredBy], (unitMeasure:IUnitMeasure) => {

                if (unitMeasure.amount > 0) {

                    this.display.unitAmounts.push(this.formatAmount(unitMeasure.amount, unitMeasure.amountType));
                    this.display.valid = true;
                }

            });
        }

        if (this.showApproxMediumCounts && this.recipeIngredient.unitCountsEnabled && this.recipeIngredient.mediumStandardWeight > 0 && convertedValues.unrounded.grams > 0) {
            this.display.approxMedium = _.ceil(convertedValues.unrounded.grams / this.recipeIngredient.mediumStandardWeight);
        }

        if (!this.display.valid) {
            this.$log.error('Display not valid for ingredient ' + this.recipeIngredient.getName(), this.recipeIngredient);
        }
    }

    private formatAmount(amount:number, type:string):IUnitAmount {

        let unitAmount = {
            unit: null,
            amount: null,
        };

        let unitType:IUnitType;
        if (_.has(IngredientDisplayController.unitTypes, type)) {
            unitType = IngredientDisplayController.unitTypes[type];
        } else {
            unitType = <IUnitType> { // Custom unit type (recipe.amountType)
                fractionize: true,
                type: type
            }
        }

        let displayType:string;

        if (_.isString(unitType.type)) {
            displayType = (<string>unitType.type);
        }
        else { // Type has plural
            if (amount > 1) {
                displayType = (<IPluralType>unitType.type).plural;
            }
            else {
                displayType = (<IPluralType>unitType.type).singular;
            }
        }

        if (!unitType.fractionize) {

            unitAmount.amount = amount.toString();
            unitAmount.unit = displayType;
            return unitAmount;
        }

        let fraction:number = Number((amount % 1).toPrecision(2));
        let wholeNumber:number = Math.floor(amount);
        let numberString:string = '';

        if (wholeNumber > 0) {
            numberString = wholeNumber.toString();
        }

        switch (fraction) {
            case(0.25):
                numberString += QUARTER_CHAR;
                break;

            case(0.33):
                numberString += THIRD_CHAR;
                break;

            case(0.5):
                numberString += HALF_CHAR;
                break;

            case(0.67):
                numberString += TWO_THIRDS_CHAR;
                break;

            case(0.75):
                numberString += THREE_QUARTER_CHAR;
                break;

            default:
                numberString = amount.toString();
                break;
        }

        unitAmount.amount = numberString;
        unitAmount.unit = displayType;
        return unitAmount;
    }

}

class IngredientDisplayDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ingredientDisplay'];
    public template = require('./ingredientDisplay.tpl.html');
    public replace = true;
    public scope = {
        recipeIngredient: '<',
        measurementSystem: '@?',
        measuresEnabled: '<?',
        linkIngredient: '<?',
        watchIngredient: '<?', // Firefox freaks out if you have a property called 'watch'
        includeDescription: '<?',
        showAsOnRecipe: '<?',
        showApproxMediumCounts: '<?'
    };

    public controllerAs = 'IngredientDisplayController';
    public controller = IngredientDisplayController;
    public bindToController = true;

    constructor() {
    }

    static factory():ng.IDirectiveFactory {
        const directive = () => new IngredientDisplayDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('ingredientDisplay', IngredientDisplayDirective.factory());

