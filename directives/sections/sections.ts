import * as angular from "angular";
import * as _ from "lodash";
import {SectionListingController, namespace as listing} from "./sectionListing/sectionListing";
import {namespace as media} from "./mediaSection/mediaSection";
import {namespace as promo} from "./promoSection/promoSection";
import {namespace as richText} from "./richTextSection/richTextSection";
import {namespace as blockquote} from "./blockquoteSection/blockquoteSection";
import {namespace as recipeInfoBar} from "./recipeInfoBarSection/recipeInfoBarSection";

export const namespace = 'common.directives.sections';

export interface ISectionAttributes extends ng.IAttributes {
    sectionType:string;
}

export class SectionTypeDirective implements ng.IDirective {

    public restrict = 'A';
    public require = ['^sectionListing'];

    constructor(public $compile:ng.ICompileService, public $injector:ng.auto.IInjectorService) {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ISectionAttributes, $controllers:[SectionListingController]) => {

        let childFormatDirectiveKey = _.camelCase($scope.$eval($attrs.sectionType)) + 'Section';

        if (!_.has($attrs, childFormatDirectiveKey)) {

            let childFormatDirectiveName = _.kebabCase(childFormatDirectiveKey);

            //$element.removeAttr('ng-repeat'); //prevent the ng-repeat from recompiling

            if (this.$injector.has(childFormatDirectiveKey + 'Directive')) {
                $element.attr(childFormatDirectiveName, '');
                $element.removeAttr('section-type');
                this.$compile($element, null, 1)($scope);
            } else {
                console.error(`Directive ${childFormatDirectiveName}:${childFormatDirectiveKey} has not been implemented! This will show an error in the section listing.`);
                $element.remove();
            }

        }
    };

    static factory():ng.IDirectiveFactory {
        const directive = ($compile, $injector) => new SectionTypeDirective($compile, $injector);
        directive.$inject = ['$compile', '$injector'];
        return directive;
    }
}

angular.module(namespace, [
    media,
    promo,
    listing,
    richText,
    blockquote,
    recipeInfoBar,
]);
//this is an alternative one-time binding method that may be more performant, but break live preview etc,
// keeping this directive for now until we decide performance is ok. @todo remove directive or re-implement
//.directive('sectionType', SectionTypeDirective.factory());

