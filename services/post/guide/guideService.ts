import * as angular from "angular";
import * as _ from "lodash";
import Guide from "../../../models/post/guide/guideModel";
import {PostService} from "../../abstractPostService";
import User from "../../../models/user/userModel";
import Cycle from "../../../models/cycle/cycleModel";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import Program from "../../../models/program/programModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import {MetaableApiService} from "../../../mixins/metaableApiService";
import {LocalizableApiService} from "../../../mixins/localizableApiService";
import {TaggableApiService} from "../../../mixins/taggableApiService";
import {SectionableApiService} from "../../../mixins/sectionableApiService";
import applyMixins from "../../../mixins/mixins";
import {GuideConfig} from "../../../../app/program/programItem/guide/guide";

export const namespace = 'common.services.guide';

export default class GuideService extends PostService<Guide> {

    /**
     * Get an instance of the given guide data
     * @param data
     * @returns {Article}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Guide {
        return new Guide(data, exists);
    }

    /**
     * Get the api endpoint for the entity
     * @param guide
     * @returns {string}
     */
    public apiEndpoint(guide?:Guide):string {
        if (guide) {
            return '/guides/' + guide.postId;
        }
        return '/guides';
    }

    /**
     * Get a new guide with no values and a set uuid
     * @returns {Guide}
     */
    public newEntity(author:User):Guide {

        return new Guide({
            postId: this.ngRestAdapter.uuid(),
            authorId: author.userId,
            _author: author,
            draft: true,
        });

    }

    /**
     * Returns the public facing URL for an article
     * @param guide
     * @returns {string}
     */
    public getPublicUrl(guide:Guide):string {
        // Due to inheritance of AbstractContentController in app.admin.guides.guide.content, this function has to be implemented
        return '';
    }

    /**
     * Add's a guide to a cycle. This process creates a scheduled item.
     * @param guide
     * @param cycle
     * @returns {ng.IHttpPromise<any>}
     */
    public addToCycle(guide:Guide, cycle:Cycle):ng.IPromise<CycleScheduleItem> {

        return this.ngRestAdapter.put('/cycles/' + cycle.getKey() + '/scheduled-items/guides/' + guide.getKey(), {})
            .then((res) => new CycleScheduleItem(res.data, true));

    }

    /**
     * Save all the related entities concurrently
     * @param guide
     * @returns {IPromise<any[]>}
     */
    protected saveRelatedEntities(guide:Guide):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntitySections(guide),
            this.saveEntityTags(guide),
            this.saveEntityLocalizations(guide),
            this.saveEntityMetas(guide),
            this.savePrograms(guide)
        ]);

    }

    /**
     * Save entity programs
     * @param guide
     * @returns ng.IPromise<Program[]|boolean>
     */
    private savePrograms(guide:Guide):ng.IPromise<Program[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>guide).getChanged(true), '_programs')) {
            return this.$q.when(false);
        }

        let requestObject = this.getNestedCollectionRequestObject(guide, '_programs', false, false);

        return this.ngRestAdapter.put(this.apiEndpoint(guide) + '/programs', requestObject)
            .then(() => {
                return guide._programs;
            });
    }

    public filterGuides(guides:Guide[], tag:string) {
        return _.filter(guides, (guide:Guide) => {
            // No tags to check
            if (guide._tags.length == 0) { return; }
            // Check if guide has the tag
            if (_.find(guide._tags, {'tag':tag})) {
                return guide;
            }
            return;
        });
    }
}

applyMixins(GuideService, [SectionableApiService, TaggableApiService, LocalizableApiService, MetaableApiService]);

angular.module(namespace, [])
    .service('guideService', GuideService);





