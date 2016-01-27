import * as angular from "angular";
import Blockquote from "../../../../models/section/sections/blockquoteModel";
import Section from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputBlockquote';

class SectionInputBlockquoteController {

    public section:Section<Blockquote>;
    public blockquoteForm:ng.IFormController;

    static $inject = [];

    constructor() {

    }

}

class SectionInputBlockquoteDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputBlockquote.tpl.html');
    public controllerAs = 'SectionInputBlockquoteController';
    public controller = SectionInputBlockquoteController;

    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputBlockquoteDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }
}

angular.module(namespace, [])
    .directive('sectionInputBlockquote', SectionInputBlockquoteDirective.factory())
;

