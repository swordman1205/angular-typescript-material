import {AbstractModel} from "../../../models/abstractModel";
import Section from "../../../models/section/sectionModel";

export abstract class AbstractSectionController<SectionType extends AbstractModel> {

    public section:Section<SectionType>;

}

export abstract class AbstractSectionDirective implements ng.IDirective {

    public restrict = 'A';
    public templateUrl = null;
    public replace = true;
    public scope = {
        section: '=',
    };

    public controller:any = AbstractSectionController;
    public controllerAs = 'AbstractSectionController';
    public bindToController = true;
}

