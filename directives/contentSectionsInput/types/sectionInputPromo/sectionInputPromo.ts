import * as angular from "angular";
import Promo from "../../../../models/section/sections/promoModel";
import Section from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputPromo';

class SectionInputPromoController {

    public section:Section<Promo>;
    public promoForm:ng.IFormController;

    static $inject = [];

    constructor() {

    }

}

class SectionInputPromoDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputPromo.tpl.html');
    public controllerAs = 'SectionInputPromoController';
    public controller = SectionInputPromoController;

    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputPromoDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }

}

angular.module(namespace, [])
    .directive('sectionInputPromo', SectionInputPromoDirective.factory())
;

