import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {INestedEntityMap, AbstractModel} from "../abstractModel";

export interface ICategorizedTags {
    (category:string):CategoryTagWithChildren;
}

export interface CategoryTagWithChildren extends CategoryTag {
    _tagsInCategory:LinkingTag[];
}

export interface LinkTagPivot {
    tagGroupId:string;
    tagGroupParentId:string;
}

export interface CategoryTagPivot {
    parentTagId?:string;
    tagId?:string;
    required:boolean;
    linkedTagsMustExist:boolean;
    linkedTagsMustBeChildren:boolean;
    linkedTagsLimit:number;
    readOnly:boolean;
}

@changeAware
export default class Tag extends AbstractModel {

    protected __primaryKey = 'tagId';

    protected __nestedEntityMap:INestedEntityMap = {
        _childTags: CategoryTag,
    };

    public tagId:string;
    public tag:string;
    public searchable:boolean;

    public _childTags:CategoryTag[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

export abstract class PivotableTag<PivotType> extends Tag {

    public _pivot:PivotType;

}

export class CategoryTag extends PivotableTag<CategoryTagPivot> {

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

export class LinkingTag extends PivotableTag<LinkTagPivot> {

    public _parentTags:CategoryTag[];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

export class DietaryBadge extends LinkingTag {

    public acronym:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
        this.hydrateAcronym();
    }

    private hydrateAcronym() {
        this.acronym = _.chain(this.tag.split(' '))
            .map((string:string) => _.first(string))
            .map((string:string) => string.toUpperCase())
            .value()
            .join('')
    }
}




