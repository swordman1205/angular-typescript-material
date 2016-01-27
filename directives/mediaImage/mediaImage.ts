import * as angular from "angular";
import Image from "../../models/image/imageModel";
import {namespace as dialog} from "./dialog/mediaImageDialog";

export const namespace = 'common.directives.mediaImage';

export interface IImageChangeHandler {
    (image:Image):void;
}

export interface IMediaScope extends ng.IScope {
    currentImage:Image;
    addOnlyMode:boolean;
}

export class MediaImageController {

    private changeHandler:IImageChangeHandler;
    public currentImage:Image;
    public addOnlyMode:boolean;

    static $inject = ['$mdDialog'];

    constructor(private $mdDialog) {
    }

    public registerChangeHandler(handler:IImageChangeHandler) {
        this.changeHandler = handler;
    }

    public promptMediaImageDialog(targetTab:string):ng.IPromise<Image> {

        let dialogConfig:ng.material.IDialogOptions = {
            template: require('./dialog/mediaImageDialog.tpl.html'),
            controller: 'common.directives.mediaImage.dialog.controller',
            controllerAs: 'MediaImageDialogController',
            clickOutsideToClose: true,
            locals: {
                targetTab: targetTab,
                addOnlyMode: this.addOnlyMode,
            }
        };

        return this.$mdDialog.show(dialogConfig)
            .then((image:Image) => {

                this.currentImage = image;

                if (this.changeHandler) {
                    this.changeHandler(image);
                }

                return image;
            });

    }
}

class MediaImageDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'mediaImage'];
    public template = require('./mediaImage.tpl.html');
    public replace = false;
    public scope = {
        addOnlyMode: '='
    };

    public controllerAs = 'MediaImageController';
    public controller = MediaImageController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:IMediaScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, MediaImageController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerChangeHandler((image:Image) => {
            $ngModelController.$setViewValue(image);

            $ngModelController.$setDirty();
            $ngModelController.$render();
        });

        $ngModelController.$render = () => {

            directiveController.currentImage = $ngModelController.$modelValue;
            $scope.currentImage = directiveController.currentImage;
        };
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new MediaImageDirective();
        return directive;
    }
}

angular.module(namespace, [dialog])
    .directive('mediaImage', MediaImageDirective.factory())
;

