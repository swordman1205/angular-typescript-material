import * as angular from "angular";
import {AbstractSectionController, AbstractSectionDirective} from "../abstractSection/abstractSection";
import RichText from "../../../models/section/sections/richTextModel";

export const namespace = 'common.directives.sections.richText';

class RichTextSectionController extends AbstractSectionController<RichText> {

}

class RichTextSectionDirective extends AbstractSectionDirective {

    public template = require('./richTextSection.tpl.html');

    public controller = RichTextSectionController;
    public controllerAs = 'RichTextSectionController';

    static factory():ng.IDirectiveFactory {
        const directive = () => new RichTextSectionDirective();
        return directive;
    }

}

angular.module(namespace, [])
    .directive('richTextSection', RichTextSectionDirective.factory());

