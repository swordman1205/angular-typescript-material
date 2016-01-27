import * as angular from "angular";
import * as _ from "lodash";
import Recipe from "../../models/recipe/recipeModel";
import {Paginator} from "../../services/pagination/paginationService";
import RecipeService from "../../services/recipe/recipeService";

export const namespace = 'common.directives.recipeSelect';

export interface IRecipeChangedHandler {
    (recipe:Recipe):void;
}

export class RecipeSelectController {

    static $inject = ['$mdDialog', 'recipeService', '$scope'];

    private recipeChangedHandler:IRecipeChangedHandler;

    public selectedRecipes:Recipe[] = [];

    private recipesPaginator:Paginator;

    constructor(private $mdDialog:ng.material.IDialogService,
                private recipeService:RecipeService,
                private $scope:ng.IScope) {
        this.recipesPaginator = recipeService
            .getPaginator()
            .setNested(['thumbnailImage'])
            .setCount(10);

        this.$scope.$watchCollection(() => this.selectedRecipes, (newValue, oldValue) => {
            if (!_.isEqual(newValue, oldValue)) {
                if (!_.isEmpty(this.selectedRecipes)) {
                    this.recipeChangedHandler(this.selectedRecipes[0]);
                }
                else {
                    this.recipeChangedHandler(null);
                }
                this.closeDialog();
            }
        });
    }

    public registerRecipeChangedHandler(handler:IRecipeChangedHandler):void {
        this.recipeChangedHandler = handler;
    }

    /**
     * Action called when the add recipe button is clicked on.
     * @returns {angular.IPromise<any>}
     */
    public openDialog():ng.IPromise<any> {

        return this.$mdDialog.show({
            template: require('./recipeSelectDialog.tpl.html'),
            scope: this.$scope,
            preserveScope: true,
            clickOutsideToClose: true
        })

    }

    /**
     * Action called when the close button is clicked.
     */
    public closeDialog():void {

        this.$mdDialog.hide();

    }

    /**
     * Function called by autocomplete search in recipe dialog.
     * @param queryString
     * @returns {ng.IPromise<any[]>}
     */
    public recipeSearch(queryString:string):ng.IPromise<any> {

        return this.recipesPaginator.complexQuery({
            title: [queryString]
        });

    }

}

class RecipeSelectDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'recipeSelect'];
    public template = require('./recipeSelect.tpl.html');
    public replace = true;
    public scope = {};

    public controllerAs = 'RecipeSelectController';
    public controller = RecipeSelectController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, RecipeSelectController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerRecipeChangedHandler((recipe:Recipe) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(recipe);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                if ($ngModelController.$modelValue) {
                    directiveController.selectedRecipes[0] = $ngModelController.$modelValue;
                }

            };

        }
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new RecipeSelectDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('recipeSelect', RecipeSelectDirective.factory());

