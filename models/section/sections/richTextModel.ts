import {AbstractModel} from "../../abstractModel";
import {TSectionModelType} from "../sectionModel";
export default class RichText extends AbstractModel {
    public static contentType:TSectionModelType = 'rich_text';

    public body:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}




