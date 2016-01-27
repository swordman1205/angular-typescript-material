import * as angular from "angular";
import {IPermalinkableModel} from "../../../models/abstractModel";
import {IShortcodeOptions} from "../markdownEditor";

export const namespace = 'common.directives.markdownEditor.shortcodeDialog';

export class ShortcodeDialogController {

    static $inject = ['shortcodeType', '$mdDialog'];
    public selectedEntity:IPermalinkableModel;

    constructor(public shortcodeType:string,
                private $mdDialog:ng.material.IDialogService) {

    }

    public resolveShortcode() {

        let shortcodeOptions:IShortcodeOptions = {
            slug: this.selectedEntity.permalink,
        };

        this.$mdDialog.hide(shortcodeOptions);
    }

    /**
     * allow the user to manually close the dialog
     */
    public cancelDialog() {
        this.$mdDialog.cancel('closed');
    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', ShortcodeDialogController);


