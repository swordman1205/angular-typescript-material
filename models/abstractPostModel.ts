import * as _ from "lodash";
import {AbstractModel, IMetaableModel, IPermalinkableModel, INestedEntityMap, IAttributeCastMap} from "./abstractModel";
import {SectionableModel, ISectionsDisplay} from "../mixins/sectionableModel";
import {TaggableModel} from "../mixins/taggableModel";
import {LocalizableModel} from "../mixins/localizableModel";
import {PublishableModel, TPublishableStatus} from "../mixins/publishableModel";
import User from "./user/userModel";
import Tag, {LinkingTag} from "./tag/tagModel";
import Image from "./image/imageModel";
import Localization from "./localization/localizationModel";
import Section from "./section/sectionModel";
import Meta from "./meta/metaModel";
import Article from "./post/article/articleModel";
import Comment from "./comment/commentModel";

export interface ICommentsCount {
    commentsCount:number;
    postId:string;
}

export abstract class Post extends AbstractModel implements SectionableModel, TaggableModel, LocalizableModel, IMetaableModel, IPermalinkableModel, PublishableModel {

    protected __nestedEntityMap:INestedEntityMap = {
        _sections: this.hydrateSections,
        _metas: this.hydrateMetaCollectionFromTemplate,
        _author: User,
        _tags: Tag,
        _categoryTag: LinkingTag,
        _comments: Comment,
        _localizations: Localization,
        _thumbnailImage: Image,
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
        published: this.castMoment
    };

    protected __primaryKey:string = 'postId';

    public postId:string;
    public title:string;
    public shortTitle:string;
    public permalink:string;
    public content:string;
    public draft:boolean;
    public authorId:string;
    public thumbnailImageId:string;
    public published:moment.Moment;

    public authorOverride:string;
    public showAuthorPromo:boolean;
    public authorWebsite:string;

    public publicAccess:boolean;
    public usersCanComment:boolean;

    public sectionsDisplay:ISectionsDisplay;

    public _sections:Section<any>[] = [];
    public _metas:Meta[] = [];
    public _author:User;
    public _tags:LinkingTag[] = [];
    public _categoryTag:LinkingTag;
    public _comments:Comment[] = [];
    public _localizations:Localization<Article>[] = [];
    public _commentsCount:ICommentsCount;

    // Sectionable Model
    public updateSectionsDisplay:() => void;
    public hydrateSections:(data:any, exists:boolean) => Section<any>[];

    // Publishable Model
    public getStatus:() => TPublishableStatus;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Get the article identifier
     * @returns {string}
     */
    public getIdentifier():string {

        return this.permalink || this.postId;

    }

    protected metaTemplate:string[] = [
        'name', 'description', 'keyword', 'canonical'
    ];

    /**
     * Hydrates a meta template with meta which already exists.
     * @param data
     * @param exists
     * @returns {Meta[]}
     */
    protected hydrateMetaCollectionFromTemplate(data:any, exists:boolean):Meta[] {

        return _.chain(this.metaTemplate)
            .map((metaTagName) => {

                let existingTagData = _.find((<Post>data)._metas, {metaName: metaTagName});
                if (_.isEmpty(existingTagData)) {
                    return new Meta({
                        metaName: metaTagName,
                        metaContent: '',
                        metaableId: (<Post>data).postId,
                        metaId: Post.generateUUID()
                    });
                }

                return new Meta(existingTagData);
            })
            .thru((templateMeta) => {

                let leftovers = _.reduce((<Post>data)._metas, (metaTags:Meta[], metaTagData) => {
                    if (!_.find(templateMeta, {metaName: metaTagData.metaName})) {
                        metaTags.push(new Meta(metaTagData));
                    }

                    return metaTags;
                }, []);

                return templateMeta.concat(leftovers);
            })
            .value();

    }

}




