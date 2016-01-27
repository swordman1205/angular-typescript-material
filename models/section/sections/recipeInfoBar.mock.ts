import {AbstractMock} from "../../abstractModel.mock";
import {IModelClass} from "../../abstractModel";
import RecipeInfoBar from "./recipeInfoBar";
export default class RecipeInfoBarMock extends AbstractMock {

    public getModelClass():IModelClass {
        return RecipeInfoBar;
    }

    public getMockData():Object {

        return {};
    }

    public static entity(overrides:Object = {}, exists:boolean = true):RecipeInfoBar {
        return <RecipeInfoBar> new this().buildEntity(overrides, exists);
    }

}

