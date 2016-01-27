import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import {TaggableModel} from "../../mixins/taggableModel";
import {LinkingTag} from "../tag/tagModel";
import Cycle from "../cycle/cycleModel";
import ProgramOption from "../programOption/programOptionModel";
import Image from "../image/imageModel";
import {ProgramOptionalModel} from "../../mixins/programOptionalModel";

@changeAware
export default class Program extends AbstractModel implements TaggableModel, ProgramOptionalModel {

    protected __primaryKey = 'programId';

    protected __nestedEntityMap:INestedEntityMap = {
        _tags: LinkingTag,
        _cycles: Cycle,
        _options: ProgramOption
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public programId:string;
    public programKey:string;
    public name:string;
    public periodCount:number;
    public periodLength:number;
    public periodName:string;
    public description:string;
    public logoImageId:string;
    public bannerImageId:string;
    public zuoraProductId:string;

    public _tags:LinkingTag[] = [];
    public _logoImage:Image;
    public _bannerImage:Image;
    public _cycles:Cycle[] = [];
    public _options:ProgramOption[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    /**
     * Get the program identifier
     * @returns {string}
     */
    public getIdentifier():string {

        return this.programId;
    }

}



