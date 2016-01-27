import * as angular from "angular";
import * as _ from "lodash";
import Media, {IVideoProvider, IImageContent, IVideoContent} from "../../../../models/section/sections/mediaModel";
import Section from "../../../../models/section/sectionModel";
import {AbstractSectionInputDirective} from "../abstractSectionInputDirective";

export const namespace = 'common.directives.contentSectionsInput.sectionInputMedia';

export class SectionInputMediaController {

    public selectedIndex:number = 0;
    public section:Section<Media>;
    public mediaForm:ng.IFormController;
    public imageForm:ng.IFormController;
    public videoForm:ng.IFormController;
    public videoProviders:IVideoProvider[];
    public videoProviderMap:{[providerKey:string]:IVideoProvider};

    static $inject = ['$mdDialog', '$mdBottomSheet'];

    constructor(private $mdDialog:ng.material.IDialogService,
                private $mdBottomSheet:ng.material.IBottomSheetService) {

        this.videoProviders = Media.videoProviders;
        this.videoProviderMap = _.keyBy(this.videoProviders, 'providerKey');
    }

    /**
     * Add empty media tab
     * @returns {number}
     */
    public addMedia():number {

        return this.section.content.media.push({
            type: Media.mediaTypeImage, //default type
            _image: null,
            caption: null
        });

    }

    /**
     * When image content changes update caption to alt by default
     * @param imageContent
     */
    public imageChanged(imageContent:IImageContent):void {

        if (!imageContent.caption) {
            imageContent.caption = imageContent._image.alt;
        }

    }

    public moveMedia(media:(IImageContent|IVideoContent), moveLeft:boolean = true):void {

        let mediaIndex:number = _.findIndex(this.section.content.media, media);
        let swapIndex:number = mediaIndex;

        if (moveLeft) {
            swapIndex--;
        } else {
            swapIndex++;
        }

        this.section.content.media[mediaIndex] = this.section.content.media[swapIndex];
        this.section.content.media[swapIndex] = media;
    }

    /**
     * Delete an image with prompt
     * @param media
     * @returns {IPromise<number>}
     */
    public removeMedia(media:(IImageContent|IVideoContent)):ng.IPromise<number> {

        let confirm = this.$mdDialog.confirm()
            .parent('#admin-container')
            .title(`Are you sure you want to delete this ${media.type}?`)
            .htmlContent('This action <strong>cannot</strong> be undone')
            .ariaLabel("Confirm delete")
            .ok(`Delete this ${media.type}!`)
            .cancel("Nope! Don't delete it.");

        return this.$mdDialog.show(confirm).then(() => {

            this.section.content.media = _.without(this.section.content.media, media);
            this.selectedIndex = this.section.content.media.length - 1;

            return this.section.content.media.length;
        });

    }

}

class SectionInputMediaDirective extends AbstractSectionInputDirective {

    public template = require('./sectionInputMedia.tpl.html');

    public controllerAs = 'SectionInputMediaController';
    public controller = SectionInputMediaController;
    public hasHeightOption:boolean = true;
    
    static factory():ng.IDirectiveFactory {
        const directiveFactory = (sectionService) => new SectionInputMediaDirective(sectionService);
        directiveFactory.$inject = ['sectionService'];
        return directiveFactory;
    }

}

angular.module(namespace, [])
    .directive('sectionInputMedia', SectionInputMediaDirective.factory())
;

