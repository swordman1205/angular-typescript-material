import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../abstractApiService";
import Tag, {CategoryTag, ICategorizedTags, CategoryTagWithChildren, LinkingTag} from "../../models/tag/tagModel";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import {TaggableModel} from "../../mixins/taggableModel";

export const namespace = 'common.services.tag';

export default class TagService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q'];

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint():string {
        return '/tags';
    }

    /**
     * Get an instance of the Tag given data
     * @param data
     * @returns {Tag}
     * @param exists
     */
    public modelFactory(data:any, exists:boolean = false):Tag {
        return new Tag(data, exists);
    }

    /**
     * Get a new tag with no values and a set uuid
     * @returns {Tag}
     */
    public newTag(overrides:any = {}):Tag {

        return this.modelFactory(_.merge({
            tagId: this.ngRestAdapter.uuid(),
        }, overrides));

    }

    /**
     * Get the first result, if there is no result create a new tag
     * @param query
     * @returns {IPromise<Tag>}
     */
    public firstOrNew(query:string):ng.IPromise<Tag> {

        return this.getPaginator().query(query)
            .then((results):Tag => {
                if (!_.find(results, {tag: query})) {
                    return this.newTag({tag: query});
                }

                return results[0];
            })
            .catch(():Tag => {
                return this.newTag({tag: query});
            });
    }

    /**
     * Save a tag
     * @param tag
     * @returns ng.IPromise<Tag>
     */
    public saveTag(tag:Tag):ng.IPromise<Tag> {

        return this.ngRestAdapter.put(this.apiEndpoint() + '/' + tag.tagId, _.clone(tag))
            .then(() => {
                (<IChangeAwareDecorator>tag).resetChanged(); //reset so next save only saves the changed ones
                return tag;
            });

    }

    /**
     * Get top level group tags for a particular group (e.g. articles, recipes).
     *
     * @returns {IPromise<Tag[]>}
     * @param service
     */
    public getTagCategories(service:AbstractApiService):ng.IPromise<CategoryTag[]> {

        if (!service.cachedCategoryTagPromise) {
            service.cachedCategoryTagPromise = this.getAllModels<CategoryTag>(['childTags'], service.apiEndpoint() + '/tag-categories')
        }

        return service.cachedCategoryTagPromise;
    }

    /**
     * Categorize an entity's tags for ease of use.
     *
     * @param entity
     * @param service
     * @returns {IPromise<TResult>}
     */
    public categorizeTags<T extends TaggableModel, S extends AbstractApiService>(entity:T, service:S):ng.IPromise<ICategorizedTags>|ICategorizedTags {

        return this.getTagCategories(service)
            .then((categoryTags:CategoryTag[]) => {

                // Get the keys of the return object, strip out any spaces
                let keys = _.map(categoryTags, (categoryTag:CategoryTag) => {
                    return categoryTag.tag.replace(' ', '');
                });

                let tagTagIds = _.zipObject(
                    keys,
                    categoryTags
                );

                return _.mapValues(tagTagIds, (categoryTag:CategoryTag) => {
                    (<CategoryTagWithChildren>categoryTag)._tagsInCategory = _.filter(entity._tags, (tag:LinkingTag) => {
                        return tag._pivot.tagGroupId == categoryTag.tagId;
                    });

                    return categoryTag;
                });

            });

    }

}

angular.module(namespace, [])
    .service('tagService', TagService);





