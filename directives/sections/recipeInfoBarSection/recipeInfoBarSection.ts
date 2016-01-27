import * as angular from "angular";
import * as _ from "lodash";
import {AbstractSectionController, AbstractSectionDirective} from "../abstractSection/abstractSection";
import RecipeInfoBar from "../../../models/section/sections/recipeInfoBar";
import Recipe from "../../../models/recipe/recipeModel";

export const namespace = 'common.directives.sections.recipeInfoBar';

type TRatingSymbol = 'empty' | 'half' | 'full';

class RecipeInfoBarSectionController extends AbstractSectionController<RecipeInfoBar> {

    public recipe:Recipe;
    public maxRating:number = 5;

    public ratingArray:TRatingSymbol[] = [];

    constructor() {
        super();
        this.initRatingArray();
    }

    private initRatingArray():void {

        let rating = _.get(this.recipe, '_ratingInfo.__roundedRating', 0);

        for (let currentStar = 1; currentStar <= this.maxRating; currentStar++) {
            if (currentStar <= rating) {
                this.ratingArray.push('full');
            } else if (currentStar < rating + 1) {
                this.ratingArray.push('half');
            } else {
                this.ratingArray.push('empty');
            }
        }
    }
}

class RecipeInfoBarSectionDirective extends AbstractSectionDirective {

    public template = require('./recipeInfoBarSection.tpl.html');

    public controller = RecipeInfoBarSectionController;
    public controllerAs = 'RecipeInfoBarSectionController';

    public scope = {
        section: '=',
        recipe: '=',
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new RecipeInfoBarSectionDirective();
        return directive;
    }

}

angular.module(namespace, [])
    .directive('recipeInfoBarSection', RecipeInfoBarSectionDirective.factory());

