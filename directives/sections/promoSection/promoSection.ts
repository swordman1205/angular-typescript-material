import * as angular from "angular";
import {AbstractSectionController, AbstractSectionDirective} from "../abstractSection/abstractSection";
import Promo from "../../../models/section/sections/promoModel";

export const namespace = 'common.directives.sections.promo';

class PromoSectionController extends AbstractSectionController<Promo> {

}

class PromoSectionDirective extends AbstractSectionDirective {

    public template = require('./promoSection.tpl.html');

    public controller = PromoSectionController;
    public controllerAs = 'PromoSectionController';

    static factory():ng.IDirectiveFactory {
        const directive = () => new PromoSectionDirective();
        return directive;
    }

}

angular.module(namespace, [])
    .directive('promoSection', PromoSectionDirective.factory());

