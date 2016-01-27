import changeAware from "../../../decorators/changeAware/changeAwareDecorator";
import {Post} from "../../abstractPostModel";
import {SectionableModel} from "../../../mixins/sectionableModel";
import {PublishableModel} from "../../../mixins/publishableModel";
import {LocalizableModel} from "../../../mixins/localizableModel";
import applyMixins from "../../../mixins/mixins";
@changeAware
export default class ProgramPost extends Post {

    static __shortcode:string = 'programPost';

    public shortTitle:string = undefined;

    protected __metaTemplate:string[] = [
        'name', 'description', 'keyword', 'canonical'
    ];

    public programCycleId:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

applyMixins(ProgramPost, [SectionableModel, LocalizableModel, PublishableModel]);