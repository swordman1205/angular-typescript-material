import * as angular from "angular";
import Recipe from "../../../../models/recipe/recipeModel";
import RecipeInfoBar from "../../../../models/section/sections/recipeInfoBar";
import Section from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputRecipeInfoBar';

class SectionInputRecipeInfoBarController {

    public section:Section<RecipeInfoBar>;
    public recipe:Recipe;

    static $inject = [];

    constructor() {
    }

}

class SectionInputRecipeInfoBarDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputRecipeInfoBar.tpl.html');
    public controllerAs = 'SectionInputRecipeInfoBarController';
    public controller = SectionInputRecipeInfoBarController;

    public scope = {
        section: '=',
        recipe: '=',
    };

    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputRecipeInfoBarDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }

}

angular.module(namespace, [])
    .directive('sectionInputRecipeInfoBar', SectionInputRecipeInfoBarDirective.factory())
;

