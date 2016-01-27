import * as angular from "angular";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import Section, {ISectionFormattingOptions} from "../../../models/section/sectionModel";
import {ContentSectionsInputSetController} from "../set/contentSectionsInputSet";
import SectionService from "../../../services/section/sectionService";

export const namespace = 'common.directives.contentSectionsInput.item';

export interface ISettingsControllerBindings {
    templateUrl?:string;
    controller?:Object;
    controllerAs?:string;
    formattingOptionsPromise?:ng.IPromise<ISectionFormattingOptions>;
}

export class ContentSectionsInputItemController {

    public toolbarOpen = false;
    public section:Section<any>;
    private childControllerSettings:ISettingsControllerBindings = null;
    public $element:ng.IAugmentedJQuery|JQuery;
    public parentSetController:ContentSectionsInputSetController;
    public parent:any;

    static $inject = ['ngRestAdapter', '$mdBottomSheet', '$q', 'sectionService'];

    constructor(private ngRestAdapter:NgRestAdapterService,
                private $mdBottomSheet:ng.material.IBottomSheetService,
                private $q:ng.IQService,
                private sectionService:SectionService) {

    }

    public registerSettingsBindings(bindingSettings:ISettingsControllerBindings):void {

        this.childControllerSettings = bindingSettings;
    }

    /**
     * Toggle the settings pane.
     * @todo Note that we are only popping an empty (dummy) bottom sheet because the md-fab-toolbar
     * does not have capabilities to lock it open while the bottom sheet is open. Instead we are partially replicating
     * the functionality of fab-toolbar and using the event bound to bottomSheet opening to prompt the toolbar to
     * close when we click away. This should be refactored to use fab-toolbar when https://github.com/angular/material/issues/4973
     * is fixed.
     * @param $event
     */
    public toggleSettings($event:MouseEvent):ng.IPromise<any> {

        this.toolbarOpen = !this.toolbarOpen;

        if (this.toolbarOpen) {

            let bottomSheetConfig:ng.material.IBottomSheetOptions = {
                template: require('./baseSettingsMenu.tpl.html'),
                parent: jQuery(this.$element).find('.section-input'),
                targetEvent: $event,
                disableParentScroll: false,
                controller: SettingsSheetController,
                controllerAs: 'SettingsSheetController',
                locals: {
                    section: this.section,
                    formattingOptions: null,
                }
            };

            if (this.childControllerSettings) {
                bottomSheetConfig = _.merge(bottomSheetConfig, {
                    templateUrl: this.childControllerSettings.templateUrl,
                    controllerAs: this.childControllerSettings.controllerAs,
                    locals: {
                        formattingOptions: this.childControllerSettings.formattingOptionsPromise,
                    }
                });
            }

            return this.$mdBottomSheet.show(bottomSheetConfig).finally(() => {
                this.toolbarOpen = false;
            });

        } else {
            this.$mdBottomSheet.cancel(false);
        }

    }

}

export class SettingsSheetController {

    static $inject = ['section', 'sectionService', 'formattingOptions'];

    constructor(public section:Section<any>,
                private sectionService:SectionService,
                public formattingOptions:ISectionFormattingOptions) {

    }

}

class ContentSectionsInputItemDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['contentSectionsInputItem', '^contentSectionsInputSet'];
    public template = require('./contentSectionsInputItem.tpl.html');
    public replace = false;
    public scope = {
        section: '=',
        parent: '=?'
    };

    public controllerAs = 'ContentSectionsInputItemController';
    public controller = ContentSectionsInputItemController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:ng.IScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ContentSectionsInputItemController, ContentSectionsInputSetController]) => {

        let thisController = $controllers[0];
        let parentSetController = $controllers[1];

        thisController.parentSetController = parentSetController;

        thisController.$element = $element;

    };

    static factory():ng.IDirectiveFactory {
        return () => new ContentSectionsInputItemDirective();
    }
}

angular.module(namespace, [])
    .directive('contentSectionsInputItem', ContentSectionsInputItemDirective.factory())
;

