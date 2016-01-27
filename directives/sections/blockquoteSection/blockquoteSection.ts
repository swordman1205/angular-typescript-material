import * as angular from "angular";
import {AbstractSectionDirective, AbstractSectionController} from "../abstractSection/abstractSection";
import Blockquote from "../../../models/section/sections/blockquoteModel";

export const namespace = 'common.directives.sections.blockquote';

class BlockquoteSectionController extends AbstractSectionController<Blockquote> {

}

class BlockquoteSectionDirective extends AbstractSectionDirective {

    public template = require('./blockquoteSection.tpl.html');

    public controller = BlockquoteSectionController;
    public controllerAs = 'BlockquoteSectionController';

    static factory():ng.IDirectiveFactory {
        const directive = () => new BlockquoteSectionDirective();
        return directive;
    }

}

angular.module(namespace, [])
    .directive('blockquoteSection', BlockquoteSectionDirective.factory());

