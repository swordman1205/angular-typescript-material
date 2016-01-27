import * as angular from "angular";
import Recipe from "../../../../models/recipe/recipeModel";
import IngredientsDirections from "../../../../models/section/sections/ingredientsDirections";
import Section from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputIngredientsDirections';

class SectionInputIngredientsDirectionsController {

    public section:Section<IngredientsDirections>;
    public recipe:Recipe;

    static $inject = [];

    constructor() {
    }

}

class SectionInputIngredientsDirectionsDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputIngredientsDirections.tpl.html');
    public controllerAs = 'SectionInputIngredientsDirectionsController';
    public controller = SectionInputIngredientsDirectionsController;

    public scope = {
        section: '=',
        recipe: '=',
    };

    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputIngredientsDirectionsDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }

}

angular.module(namespace, [])
    .directive('sectionInputIngredientsDirections', SectionInputIngredientsDirectionsDirective.factory())
;

