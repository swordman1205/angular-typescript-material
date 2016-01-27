import * as angular from "angular";
import RichText from "../../../../models/section/sections/richTextModel";
import Section, {IFormatOption} from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputRichText';

class SectionInputRichTextController {

    public section:Section<RichText>;
    public richTextForm:ng.IFormController;

    static $inject = [];

    constructor() {

    }

}

class SectionInputRichTextDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputRichText.tpl.html');
    public controllerAs = 'SectionInputRichTextController';
    public controller = SectionInputRichTextController;

    protected styleOptions:IFormatOption[] = [
        {
            key: 'standardParagraph',
            name: 'Standard Paragraph',
        },
        {
            key: 'standFirst',
            name: 'Stand First',
        },
        {
            key: 'sarahSays',
            name: 'Sarah Says',
        },
        {
            key: 'beware',
            name: 'Beware',
        },
        {
            key: 'knowThis',
            name: 'Know This',
        },
        {
            key: 'tip',
            name: 'Tip',
        },
        {
            key: 'fact',
            name: 'Fact',
        },
    ];

    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputRichTextDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }

}

angular.module(namespace, [])
    .directive('sectionInputRichText', SectionInputRichTextDirective.factory())
;

