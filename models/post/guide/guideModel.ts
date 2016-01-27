import changeAware from "../../../decorators/changeAware/changeAwareDecorator";
import {Post} from "../../abstractPostModel";
import {INestedEntityMap} from "../../abstractModel";
import User from "../../user/userModel";
import Comment from "../../comment/commentModel";
import Image from "../../image/imageModel";
import Tag, {LinkingTag} from "../../tag/tagModel";
import Localization from "../../localization/localizationModel";
import Program from "../../program/programModel";
import {PublishableModel} from "../../../mixins/publishableModel";
import {LocalizableModel} from "../../../mixins/localizableModel";
import {SectionableModel} from "../../../mixins/sectionableModel";
import applyMixins from "../../../mixins/mixins";

@changeAware
export default class Guide extends Post {

    static __shortcode:string = 'guide';

    protected __nestedEntityMap:INestedEntityMap = {
        _sections: this.hydrateSections,
        _metas: this.hydrateMetaCollectionFromTemplate,
        _author: User,
        _tags: Tag,
        _categoryTag: LinkingTag,
        _comments: Comment,
        _localizations: Localization,
        _thumbnailImage: Image,
        _programs: Program,
    };

    protected __metaTemplate:string[] = [
        'name', 'description', 'keyword', 'canonical'
    ];

    public _programs:Program[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

applyMixins(Guide, [SectionableModel, LocalizableModel, PublishableModel]);