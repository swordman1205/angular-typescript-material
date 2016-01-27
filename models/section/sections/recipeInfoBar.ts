import {AbstractModel} from "../../abstractModel";
import {TSectionModelType} from "../sectionModel";
export default class RecipeInfoBar extends AbstractModel {

    public static contentType:TSectionModelType = 'recipe_info_bar';

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

