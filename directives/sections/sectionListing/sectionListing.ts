import * as angular from "angular";
import Section from "../../../models/section/sectionModel";

export const namespace = 'common.directives.sections.listing';

export class SectionListingController {

    public sections:Section<any>;

    static $inject:string[] = [];

    constructor() {

    }

}

export class SectionListingDirective implements ng.IDirective {

    public restrict = 'E';
    public template = require('./sectionListing.tpl.html');
    public replace = false;
    public scope = {
        sections: '=',
    };

    public controller = SectionListingController;
    public controllerAs = 'SectionListingController';
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes) => {

    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new SectionListingDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('sectionListing', SectionListingDirective.factory());

