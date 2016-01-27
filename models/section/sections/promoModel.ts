import {AbstractModel} from "../../abstractModel";
import {TSectionModelType} from "../sectionModel";
export default class Promo extends AbstractModel {

    public static contentType:TSectionModelType = 'promo';

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}



