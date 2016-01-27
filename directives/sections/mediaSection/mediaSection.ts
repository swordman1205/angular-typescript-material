import * as angular from "angular";
import {AbstractSectionController, AbstractSectionDirective} from "../abstractSection/abstractSection";
import Media from "../../../models/section/sections/mediaModel";

export const namespace = 'common.directives.sections.media';

class MediaSectionController extends AbstractSectionController<Media> {

    public selectedIndex:number = 0;
    public clHeight:number;
    public clWidth:number;
    public clWidthInPixels:number = 1200;

    public constructor() {
        super();
        this.setClImageParams();
    }
    
    public onSwipeLeft() {
        if (this.selectedIndex == this.section.content.media.length - 1) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex++;
        }
    }

    public onSwipeRight() {
        if (this.selectedIndex == 0) {
            this.selectedIndex = this.section.content.media.length - 1;
        } else {
            this.selectedIndex--;
        }
    }

    public swipeToImage(index) {
        this.selectedIndex = index;
    }

    public setClImageParams():void {

        if (!this.section || !this.section.format) {
            return;
        }

        // Set aspect ratio
        if (this.section.format.height == 'twoToOne') {
            // 2:1
            this.clHeight = 0.5;
            this.clWidth = 1;
        } else if (this.section.format.height == 'oneToOne') {
            // 1:1
            this.clHeight = 1;
            this.clWidth = 1;
        } else {
            // Natural ie maintain aspect ratio
            this.clWidth = null;
            this.clHeight = null;
        }

        // Set width in pixels
        if (this.section.format.size == 'oneThird') {
            this.clWidthInPixels = 400;
        } else if (this.section.format.size == 'twoThird') {
            this.clWidthInPixels = 800;
        } else {
            // full width
            this.clWidthInPixels = 1200;
        }
    }
    
    /*
     * @TODO create an option in the media module to apply a class to say that this is not a slider. Of which will show it in its default dimensions
     * This is a quick fix, that sets default dimensions if the media is an Image and there is only a single image…
     */
    public isSingleImage():boolean {
        return this.section.content.media.length == 1 && this.section.content.media[0].type === 'image';
    }

    public getClImageSrc(imageId:string, format:string):string {

        // Appears images aren't always saved with a format
        if (format && typeof format !== "undefined") {
            format = '.' + format;
        } else {
            format = '';
        }

        // Use the default, ie maintain aspect ratio
        if (!this.clWidth || !this.clHeight) {
            return `https://res.cloudinary.com/iquitsugar/image/upload/w_${this.clWidthInPixels},c_fill/${imageId}${format}`;
        }

        let aspectRatio = (this.clWidth/this.clHeight).toFixed(1);
        return `https://res.cloudinary.com/iquitsugar/image/upload/w_${this.clWidthInPixels},ar_${aspectRatio},c_fill/${imageId}${format}`;
    }
}

class MediaSectionDirective extends AbstractSectionDirective {

    public template = require('./mediaSection.tpl.html');

    public controller = MediaSectionController;
    public controllerAs = 'MediaSectionController';
    public scope = {
        section: '=',
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new MediaSectionDirective();
        return directive;
    }

}

angular.module(namespace, [])
    .directive('mediaSection', MediaSectionDirective.factory());

