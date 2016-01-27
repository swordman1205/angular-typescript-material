import {TSectionModelType} from "../sectionModel";
import {AbstractModel} from "../../abstractModel";
export default class IngredientsDirections extends AbstractModel {

    public static contentType:TSectionModelType = 'ingredients_directions';

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

