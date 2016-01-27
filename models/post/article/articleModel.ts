import {Post} from "../../abstractPostModel";
import {SectionableModel} from "../../../mixins/sectionableModel";
import {LocalizableModel} from "../../../mixins/localizableModel";
import {PublishableModel} from "../../../mixins/publishableModel";
import applyMixins from "../../../mixins/mixins";
import changeAware from "../../../decorators/changeAware/changeAwareDecorator";
import {ISchedulableModel} from "../../../directives/scheduleToolbar/scheduleToolbar";

@changeAware
export default class Article extends Post implements ISchedulableModel {

    static __shortcode:string = 'article';

    public shortTitle:string;

    protected __metaTemplate:string[] = [
        'name', 'description', 'keyword', 'canonical'
    ];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

applyMixins(Article, [SectionableModel, LocalizableModel, PublishableModel]);

