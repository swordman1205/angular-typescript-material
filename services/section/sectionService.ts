import * as angular from "angular";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {ISectionFormattingOptions} from "../../models/section/sectionModel";

export const namespace = 'common.services.section';

export default class SectionService {

    static $inject:string[] = ['ngRestAdapter'];

    constructor(private ngRestAdapter:NgRestAdapterService) {

    }

    private sectionFormattingCachePromise:ng.IPromise<ISectionFormattingOptions> = null;

    /**
     * Get all sections from the API
     * @returns {any}
     */
    public getSectionFormatting():ng.IPromise<ISectionFormattingOptions> {

        //store the promise in cache, so next time it is called the sections are resolved immediately.
        if (!this.sectionFormattingCachePromise) {
            this.sectionFormattingCachePromise = this.ngRestAdapter.get('/sections/formatting-options').then(res => res.data);
        }

        return this.sectionFormattingCachePromise;
    }

}

angular.module(namespace, [])
    .service('sectionService', SectionService);





