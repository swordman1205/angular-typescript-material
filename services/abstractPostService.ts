import * as _ from "lodash";
import User from "../models/user/userModel";
import Recipe from "../models/recipe/recipeModel";
import {Post} from "../models/abstractPostModel";
import PaginationService from "./pagination/paginationService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import Meta from "../models/meta/metaModel";
import Comment from "../models/comment/commentModel";
import Localization from "../models/localization/localizationModel";
import {LocalizableModel} from "../mixins/localizableModel";
import {IMetaableModel, AbstractModel} from "../models/abstractModel";
import Tag from "../models/tag/tagModel";
import {TaggableModel} from "../mixins/taggableModel";
import Section from "../models/section/sectionModel";
import {SectionableModel} from "../mixins/sectionableModel";
import {MetaableApiService} from "../mixins/metaableApiService";
import {LocalizableApiService} from "../mixins/localizableApiService";
import {TaggableApiService} from "../mixins/taggableApiService";
import {SectionableApiService} from "../mixins/sectionableApiService";
import {AbstractApiService, IExtendedApiService} from "./abstractApiService";
import {IChangeAwareDecorator} from "../decorators/changeAware/changeAwareDecorator";
import {momentExtended as moment} from "../../common/libs/moment/moment";

export interface ICommentableService {
    saveComment(entity:Post | Recipe, author:User, commentText:string):ng.IPromise<Comment>;
}

//@todo make default export when https://github.com/Microsoft/TypeScript/issues/3792 is fixed
export abstract class PostService<M extends Post | Recipe> extends AbstractApiService implements IExtendedApiService, SectionableApiService, TaggableApiService, LocalizableApiService, MetaableApiService, ICommentableService {

    //SectionableApiService
    public saveEntitySections:(entity:SectionableModel) => ng.IPromise<Section<any>[]|boolean>;
    public deleteSection:(entity:SectionableModel, section:Section<any>) => ng.IPromise<boolean>;
    public saveEntitySectionLocalizations:(entity:SectionableModel) => ng.IPromise<any>;
    public newSection:<S extends AbstractModel>(sectionType:string, content:S, parentModel?:AbstractModel) => Section<S>;
    public getSection:(entity:SectionableModel, sectionId:string) => ng.IPromise<Section<any>>;

    //TaggbleApiService
    public saveEntityTags:(entity:TaggableModel) => ng.IPromise<Tag[]|boolean>;

    //LocalizableApiService
    public saveEntityLocalizations:(entity:LocalizableModel) => ng.IPromise<Localization<any>[]|boolean>;

    //MetaableApiService
    public hydrateMetaCollection:(entity:IMetaableModel) => Meta[];

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    public abstract newEntity(author:User):M;

    /**
     * Save with all the nested entities too
     * @param entity
     * @returns {IPromise<M>}
     */
    public save(entity:M):ng.IPromise<M> {

        return this.saveModel(entity)
            .then(() => this.$q.all([
                this.saveRelatedEntities(entity),
                this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>entity).resetChanged(); //reset so next save only saves the changed ones
                entity.setExists(true);
                return entity;
            });

    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    protected saveRelatedEntities(entity:M):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntitySections(entity),
            this.saveEntityTags(entity),
            this.saveEntityLocalizations(entity),
            this.saveEntityMetas(entity),
        ]);

    }

    /**
     * Save entity metas
     * @param entity
     * @returns {any}
     */
    protected saveEntityMetas(entity:M):ng.IPromise<Meta[]|boolean> {

        if (!_.has((<IChangeAwareDecorator>entity).getChanged(true), '_metas')) {
            return this.$q.when(false);
        }

        let requestObject = this.getNestedCollectionRequestObject(entity, '_metas', false);

        requestObject = _.filter(<Array<any>>requestObject, (metaTag) => {
            return !_.isEmpty(metaTag.metaContent);
        });

        return this.ngRestAdapter.put(this.apiEndpoint(entity) + '/meta', requestObject)
            .then(() => {
                _.invokeMap(entity._metas, 'setExists', true);
                return entity._metas;
            });
    }

    /**
     * Save a post|recipes's comment
     * @returns {IPromise<Comment>}
     * @param entity
     * @param author
     * @param commentText
     */
    public saveComment(entity:M, author:User, commentText:string):ng.IPromise<Comment> {

        let newComment = new Comment({
            _author: author,
            body: commentText,
            createdAt: moment(),
        });

        return this.ngRestAdapter.post(this.apiEndpoint(entity) + '/comments', newComment)
            .then((response) => {
                newComment.postCommentId = response.data.postCommentId;
                newComment.setExists(true);
                return newComment;
            });
    }

}





