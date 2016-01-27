import * as angular from "angular";
import * as _ from "lodash";
import Image from "../../../models/image/imageModel";
import {IImageUploadOptions, default as ImageService, IImageNotification} from "../../../services/image/imageService";
import {Paginator} from "../../../services/pagination/paginationService";

export const namespace = 'common.directives.mediaImage.dialog';

export interface IImageUploadedHandler {
    (image:Image):void;
}

export interface IProgressBar {
    statusText:string;
    visible:boolean;
    mode:string;
    value:number;
}

export interface IImageConstraints {
    maxHeight:number;
    minHeight:number;
    maxWidth:number;
    minWidth:number;
    maxSize:string;
    minSize:string;
}

export class MediaImageDialogController {

    public progressBar:IProgressBar = {
        statusText: 'Saving...',
        visible: false,
        mode: 'query',
        value: 0
    };

    public imageConstraints:IImageConstraints = {
        maxHeight: 2500,
        minHeight: 100,
        maxWidth: 2500,
        minWidth: 100,
        maxSize: '20MB',
        minSize: '10KB',
    };

    //Tabbing
    public selectedTabIndex:number;
    private tabIndex = ['upload', 'select'];

    //Upload Image
    public queuedImage:IImageUploadOptions;
    public imageUploadForm:ng.IFormController;
    private imageUploadedHandler:IImageUploadedHandler;
    public uploadedImage:Image;

    //Select from Image
    public selectedImage:Image;
    public library:Image[];
    private imagesPaginator:Paginator;
    private perPage:number = 12;
    public pages:number[];
    public currentPage:number = 1;
    private currentPageIndex:number;

    static $inject = ['$mdDialog', 'imageService', 'targetTab', 'addOnlyMode'];

    constructor(private $mdDialog:ng.material.IDialogService,
                private imageService:ImageService,
                private targetTab:string,
                private addOnlyMode:boolean) {

        this.init();
    }

    private init() {

        this.selectedTabIndex = _.indexOf(this.tabIndex, this.targetTab);

        this.imagesPaginator = this.imageService.getPaginator().setCount(this.perPage);

        this.imagesPaginator.getPage(this.currentPage)
            .then((images:Image[]) => {
                this.library = images;
                this.pages = this.imagesPaginator.getPages();
            });

        this.currentPageIndex = this.currentPage - 1;
    }

    public toggleImageSelection(selectedImage:Image) {

        if (this.selectedImage == selectedImage) {
            this.selectedImage = null;
        } else {
            this.selectedImage = selectedImage;
        }
    }

    public selectImage() {

        if (!this.selectedImage) {
            this.$mdDialog.cancel('closed');
        }

        this.$mdDialog.hide(this.selectedImage);
    }

    public goToPage(page:number):ng.IPromise<Image[]> {

        this.currentPage = page;

        return this.imagesPaginator.getPage(this.currentPage)
            .then((images:Image[]) => {
                this.library = images;
                return this.library;
            });
    }

    public uploadImage(image:IImageUploadOptions):void {

        this.progressBar.visible = true;
        let onSuccess = (image:Image) => {

            this.progressBar.visible = false;

            if (this.imageUploadedHandler) {
                this.imageUploadedHandler(image);
            }

            this.queuedImage = null;
            this.imageUploadForm.$setPristine();
            this.imageUploadForm.$setUntouched();
            this.uploadedImage = image;
            this.$mdDialog.hide(this.uploadedImage);

        };

        let onNotify = (notification:IImageNotification) => {

            this.progressBar.statusText = notification.message;
            switch (notification.event) {
                case 'cloudinary_upload':
                    this.progressBar.mode = 'determinate';
                    this.progressBar.value = notification.progressValue;
                    break;
                default:
                    this.progressBar.mode = 'indeterminate';
            }
        };

        this.imageService.uploadImage(image)
            .then(onSuccess, null, onNotify);
    }

    /**
     * allow the user to manually close the dialog
     */
    public cancelDialog() {
        this.$mdDialog.cancel('closed');
    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', MediaImageDialogController);


