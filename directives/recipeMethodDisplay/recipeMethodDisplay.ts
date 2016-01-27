import * as angular from "angular";
import * as _ from "lodash";
import Direction from "../../models/direction/directionModel";
import RecipeGroup from "../../models/recipe/recipeGroupModel";
import RecipeIngredient from "../../models/recipe/recipeIngredientModel";
import Recipe from "../../models/recipe/recipeModel";
import {METRIC_TYPE} from "../../models/unitConversion/unitConversion";
import RecipeService from "../../services/recipe/recipeService";
import RegionService from "../../services/region/regionService";

export const namespace = 'common.directives.recipeMethodDisplay';

export interface IRecipeMethodIngredients {
    group:RecipeGroup;
    ingredients:RecipeIngredient[];
}

export interface IRecipeMethodDirections {
    group:RecipeGroup;
    directionGroups:IDirectionGroup[];
}

export interface IDirectionGroup {
    numbered:boolean;
    directions:Direction[];
}

export interface IDisplayUnits {
    displayMetric:boolean;
    displayMeasures:boolean;
}

export class RecipeMethodDisplayController {

    public recipe:Recipe;
    public recipeMethodIngredients:IRecipeMethodIngredients[];
    public recipeMethodDirections:IRecipeMethodDirections[];
    public watch:boolean;
    public displayMetric:boolean;
    public displayMeasures:boolean;
    public convertIngredientValues:boolean = false;

    public static displayOptionsStorageKey = 'displayOptions';

    static $inject = ['recipeService', '$scope', 'regionService', '$window'];

    constructor(private recipeService:RecipeService,
                private $scope:ng.IScope,
                private regionService:RegionService,
                private $window:ng.IWindowService) {
        if (!this.loadDisplayPreferences()) {
            // Set default measurement system based on region
            this.setDefaults();
        }

        this.organiseIngredientsDirections();

        if (this.watch) {
            this.$scope.$watch(() => this.recipe._groups, (newValue, oldValue) => {
                if (!_.isEqual(newValue, oldValue)) {
                    this.organiseIngredientsDirections();
                }
            }, true);
        }
    }

    private setDefaults():void {
        if (!_.isBoolean(this.displayMetric)) {
            if (this.regionService.currentRegion) {
                let measurementType = _.find(this.regionService.supportedRegions, {code: this.regionService.currentRegion.code}).conversion;
                this.displayMetric = measurementType == METRIC_TYPE;
            }
            else {
                this.displayMetric = true;
            }
        }

        if (!_.isBoolean(this.displayMeasures)) {
            this.displayMeasures = true;
        }
    }

    public saveDisplayPreferences():void {
        this.$window.localStorage.setItem(RecipeMethodDisplayController.displayOptionsStorageKey, angular.toJson({
            displayMetric: this.displayMetric,
            displayMeasures: this.displayMeasures
        }));
    }

    private loadDisplayPreferences():boolean {

        let storedDisplayOptions:IDisplayUnits = angular.fromJson(this.$window.localStorage.getItem(RecipeMethodDisplayController.displayOptionsStorageKey));

        if (storedDisplayOptions) {
            this.displayMetric = storedDisplayOptions.displayMetric;
            this.displayMeasures = storedDisplayOptions.displayMeasures;
            return true;
        }

        return false;
    }

    private organiseIngredientsDirections() {

        // ingredients
        this.recipeMethodIngredients = _.reduce(this.recipe._groups, (ingredientGroups:IRecipeMethodIngredients[], group:RecipeGroup) => {

            ingredientGroups.push({
                ingredients: group.__ingredients, //these are already sorted
                group: group,
            });

            return ingredientGroups;

        }, []);

        // directions
        this.recipeMethodDirections = _.reduce(this.recipe._groups, (directionGroups:IRecipeMethodDirections[], group:RecipeGroup) => {

            let sortedDirections:IDirectionGroup[] = _.reduce(group.__directions, (directionGroups:IDirectionGroup[], direction:Direction) => {

                //if there aren't any group yet, start one
                if (_.isEmpty(directionGroups)) {
                    directionGroups.push({
                        numbered: direction.numbered,
                        directions: [direction],
                    });
                    return directionGroups;
                }

                if (_.last(directionGroups).numbered == direction.numbered) { //if the last direction had same numbered type, push into same array
                    _.last(directionGroups).directions.push(direction);
                } else { //start a new group
                    directionGroups.push({
                        numbered: direction.numbered,
                        directions: [direction],
                    });
                }

                return directionGroups;

            }, []);

            directionGroups.push({
                directionGroups: sortedDirections,
                group: group,
            });

            return directionGroups;

        }, []);

    }

}

class RecipeMethodDisplayDirective implements ng.IDirective {

    public restrict = 'EA';
    public require = ['ingredientsDirectionsDisplay'];
    public template = require('./recipeMethodDisplay.tpl.html');
    public replace = true;
    public scope = {
        recipe: '=',
        watch: '=?',
        displayMetric: '=?',
        displayMeasures: '=?'
    };

    public controllerAs = 'RecipeMethodDisplayController';
    public controller = RecipeMethodDisplayController;
    public bindToController = true;

    static factory():ng.IDirectiveFactory {
        return () => new RecipeMethodDisplayDirective();
    }
}

angular.module(namespace, [])
    .directive('recipeMethodDisplay', RecipeMethodDisplayDirective.factory())
;

