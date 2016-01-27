import * as angular from "angular";
import {IFormatOption, ISectionFormattingOptions} from "../../../models/section/sectionModel";
import SectionService from "../../../services/section/sectionService";
import {ContentSectionsInputItemController} from "../item/contentSectionsInputItem";

export abstract class AbstractSectionInputDirective implements ng.IDirective {

    public restrict = 'E';
    public replace = true;
    public scope = {
        section: '=',
    };

    public require = ['^contentSectionsInputItem'];

    protected styleOptions:IFormatOption[];
    public hasHeightOption:boolean = false;

    public bindToController = true;

    constructor(private sectionService:SectionService) {

    }

    public getFormattingOptions = ():ng.IPromise<ISectionFormattingOptions> => {

        return this.sectionService.getSectionFormatting().then((formattingOptions:ISectionFormattingOptions) => {

            formattingOptions = angular.copy(formattingOptions); //copy the object so binding back into the service cached object is avoided

            if (this.styleOptions) {
                formattingOptions.style = this.styleOptions;
            }

            if (!this.hasHeightOption) {
                formattingOptions.height = null;
            }

            return formattingOptions;
        });

    };

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ContentSectionsInputItemController]) => {

        let parentSectionController = $controllers[0];

        parentSectionController.registerSettingsBindings({
            formattingOptionsPromise: this.getFormattingOptions(),
        });

    };
}

