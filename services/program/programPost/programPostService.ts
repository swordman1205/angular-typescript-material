import * as angular from "angular";
import {MetaableApiService} from "../../../mixins/metaableApiService";
import {LocalizableApiService} from "../../../mixins/localizableApiService";
import {TaggableApiService} from "../../../mixins/taggableApiService";
import {SectionableApiService} from "../../../mixins/sectionableApiService";
import applyMixins from "../../../mixins/mixins";
import {PostService} from "../../abstractPostService";
import ProgramPost from "../../../models/post/programPost/programPostModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../../pagination/paginationService";
import User from "../../../models/user/userModel";
import Cycle from "../../../models/cycle/cycleModel";
import {PublishableModel, STATUS_DRAFT} from "../../../mixins/publishableModel";

export const namespace = 'programPost';

export default class ProgramPostService extends PostService<ProgramPost> {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the program post given data
     * @param data
     * @returns {ProgramPost}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):ProgramPost {
        return new ProgramPost(data, exists);
    }

    /**
     * Get the api endpoint for the entity
     * @param programPost
     * @returns {string}
     */
    public apiEndpoint(programPost?:ProgramPost):string {
        if (programPost) {
            return '/program-posts/' + programPost.postId;
        }
        return '/program-posts';
    }

    /**
     * Get a new program post with no values and a set uuid
     * @param author
     * @param cycle
     * @returns {ProgramPost}
     */
    public newEntity(author:User, cycle?:Cycle):ProgramPost {

        return new ProgramPost({
            postId: this.ngRestAdapter.uuid(),
            authorId: author.userId,
            _author: author,
            programCycleId: cycle ? cycle.programCycleId : null,
            draft: true,
        });

    }

    /**
     * Returns the public facing URL for a program post
     * @param programPost
     * @returns {string}
     */
    public getPublicUrl(programPost:ProgramPost):string {

        return 'nothing'; // @Todo: Update when guest side posts is complete

        //return this.getPublicUrlForEntity({permalink: article.getIdentifier()}, app.guest.articles.article.ArticleConfig.state);

    }

    /**
     * Save's a new program post. Will create a scheduled item and link it to the program post and
     * cycle.
     *
     * @param programPost
     * @returns {ng.IHttpPromise<any>}
     */
    public saveNew(programPost:ProgramPost):ng.IPromise<any> {

        return this.ngRestAdapter
            .post('/cycles/' + programPost.programCycleId + '/scheduled-items/' + this.ngRestAdapter.uuid() + '/program-posts/' + programPost.getKey(),
                programPost.getAttributes())

    }

}

applyMixins(ProgramPostService, [SectionableApiService, TaggableApiService, LocalizableApiService, MetaableApiService]);

angular.module(namespace, [])
    .service('programPostService', ProgramPostService);





