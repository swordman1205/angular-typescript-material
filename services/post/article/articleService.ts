import * as angular from "angular";
import Article from "../../../models/post/article/articleModel";
import {PostService} from "../../abstractPostService";
import User from "../../../models/user/userModel";
import {SectionableApiService} from "../../../mixins/sectionableApiService";
import {TaggableApiService} from "../../../mixins/taggableApiService";
import {LocalizableApiService} from "../../../mixins/localizableApiService";
import applyMixins from "../../../mixins/mixins";
import {MetaableApiService} from "../../../mixins/metaableApiService";
import {namespace as guestArticleNamespace} from "../../../../app/guest/articles/article/article";

export const namespace = 'common.services.article';

export default class ArticleService extends PostService<Article> {

    /**
     * Get an instance of the given article data
     * @param data
     * @returns {Article}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Article {
        return new Article(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @param article
     * @returns {string}
     */
    public apiEndpoint(article?:Article):string {
        if (article) {
            return '/articles/' + article.postId;
        }
        return '/articles';
    }

    /**
     * Get a new article with no values and a set uuid
     * @returns {Article}
     */
    public newEntity(author:User):Article {

        return new Article({
            postId: this.ngRestAdapter.uuid(),
            authorId: author.userId,
            _author: author
        });

    }

    /**
     * Returns the public facing URL for an article
     * @param article
     * @returns {string}
     */
    public getPublicUrl(article:Article):string {

        return this.getPublicUrlForEntity({permalink: article.getIdentifier()}, guestArticleNamespace);

    }

}

applyMixins(ArticleService, [SectionableApiService, TaggableApiService, LocalizableApiService, MetaableApiService]);

angular.module(namespace, [])
    .service('articleService', ArticleService);





