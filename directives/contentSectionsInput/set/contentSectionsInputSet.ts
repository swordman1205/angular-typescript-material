import * as angular from "angular";
import * as _ from "lodash";
import RichText from "../../../models/section/sections/richTextModel";
import Section from "../../../models/section/sectionModel";
import Blockquote from "../../../models/section/sections/blockquoteModel";
import Media from "../../../models/section/sections/mediaModel";
import Promo from "../../../models/section/sections/promoModel";
import Recipe from "../../../models/recipe/recipeModel";
import IngredientsDirections from "../../../models/section/sections/ingredientsDirections";
import RecipeInfoBar from "../../../models/section/sections/recipeInfoBar";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";

export const namespace = 'common.directives.contentSectionsInput.set';

interface IContentSectionsInputSetScope extends ng.IScope {
    ngModel():Section<any>[];
}

interface ISectionType {
    name:string,
    icon:string,
}

interface ISectionTypeMap {
    [key:string]:ISectionType;
}

interface ISectionUpdateParams {
    event:string;
    section:Section<any>;
}

interface ISectionUpdateCallback {
    (paramObject:ISectionUpdateParams):void;
}

export interface ISettingsControllerBindings {
    templateUrl:string;
    controller:Object;
    controllerAs:string;
    element:ng.IAugmentedJQuery|JQuery;
}

export class ContentSectionsInputSetController {

    private sectionTypes:ISectionTypeMap;
    public sections:Section<any>[];
    private onSectionUpdate:ISectionUpdateCallback;
    private childControllerSettings:ISettingsControllerBindings = null;
    public parent:any;

    static $inject = ['ngRestAdapter', '$mdDialog', '$mdBottomSheet'];

    constructor(private ngRestAdapter:NgRestAdapterService,
                private $mdDialog:ng.material.IDialogService,
                private $mdBottomSheet:ng.material.IBottomSheetService) {
        this.sectionTypes = {
            [RichText.contentType]: {
                name: "Rich Text",
                icon: 'format_align_left',
            },
            [Blockquote.contentType]: {
                name: "Blockquote",
                icon: 'format_quote',
            },
            [Media.contentType]: {
                name: "Media",
                icon: 'image',
            },
            [Promo.contentType]: {
                name: "Promo",
                icon: 'announcement',
            }
        };

        // If the parent is a recipe, add Ingredients & Directions section
        if (this.parent instanceof Recipe) {
            this.sectionTypes[IngredientsDirections.contentType] = {
                name: "Ingredients & Directions",
                icon: 'directions',
            };
            this.sectionTypes[RecipeInfoBar.contentType] = {
                name: "Recipe Info Bar",
                icon: 'local_dining',
            };
        }

        if (!this.sections) {
            this.sections = [];
        }
    }

    public addSectionType(sectionTypeKey:string):void {

        let section = new Section<any>({
            sectionId: this.ngRestAdapter.uuid(),
            type: sectionTypeKey,
        });

        this.sections.push(section);

        this.onSectionUpdate({
            event: 'added',
            section: section
        });
    }

    public removeSection(section:Section<any>):ng.IPromise<string> {

        let confirm = this.$mdDialog.confirm()
            .parent('#admin-container')
            .title("Are you sure you want to delete this section?")
            .htmlContent('This action <strong>cannot</strong> be undone')
            .ariaLabel("Confirm delete")
            .ok("Delete this section!")
            .cancel("Nope! Don't delete it.");

        return this.$mdDialog.show(confirm).then(() => {

            this.sections = _.without(this.sections, section);
            this.onSectionUpdate({
                event: 'deleted',
                section: section
            });

            return section.sectionId;
        });

    }

    public moveSection(section:Section<any>, moveUp:boolean = true):void {

        let sectionIndex:number = _.findIndex(this.sections, section);
        let swapIndex:number = sectionIndex;

        if (moveUp) {
            swapIndex--;
        } else {
            swapIndex++;
        }

        this.sections[sectionIndex] = this.sections[swapIndex];
        this.sections[swapIndex] = section;
        this.onSectionUpdate({
            event: 'moved',
            section: section
        });
    }

}

class ContentSectionsInputSetDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['contentSectionsInputSet', 'ngModel'];
    public template = require('./contentSectionsInputSet.tpl.html');
    public replace = true;
    public scope = {
        sections: '=ngModel',
        onSectionUpdate: '&?',
        // Optionally pass the parent object (of the sections), this may be required to enable some sections
        parent: '=?'
    };

    public controllerAs = 'ContentSectionsInputSetController';
    public controller = ContentSectionsInputSetController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:IContentSectionsInputSetScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ContentSectionsInputSetController, ng.INgModelController]) => {

        let thisController = $controllers[0];
        let $ngModelController = $controllers[1];

    };

    static factory():ng.IDirectiveFactory {
        return () => new ContentSectionsInputSetDirective();
    }
}

angular.module(namespace, [])
    .directive('contentSectionsInputSet', ContentSectionsInputSetDirective.factory())
;

