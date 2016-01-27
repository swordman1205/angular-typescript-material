import {AbstractModel} from "../../abstractModel";
import {TSectionModelType} from "../sectionModel";
export default class Blockquote extends AbstractModel {

    public static contentType:TSectionModelType = 'blockquote';

    public body:string;
    public author:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

