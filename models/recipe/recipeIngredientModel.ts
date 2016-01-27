import * as _ from "lodash";
import {AbstractModel, IAttributeCastMap, INestedEntityMap} from "../abstractModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import Ingredient from "../ingredient/ingredientModel";

export class RecipeIngredientPivot extends AbstractModel {

    public nameOverride:string;
    public optional:boolean;
    public description:string;
    public amount:number;
    public amountType:string;
    public groupId:string;
    public recipeId:string;
    public ingredientId:string;

    // @Todo: Fix API so that amount is cast to a number
    public __attributeCastMap:IAttributeCastMap = {
        amount: this.castNumber
    };

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }
}

@changeAware
export default class RecipeIngredient extends Ingredient {

    protected __primaryKey = 'ingredientId';

    protected __nestedEntityMap:INestedEntityMap = {
        _pivot: this.createOrHydratePivot
    };

    public _pivot:RecipeIngredientPivot;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public getName():string {

        if (!_.isEmpty(this._pivot.nameOverride)) {
            return this._pivot.nameOverride;
        }
        else {
            return this.name;
        }

    }

    /**
     * Hydrate with new or existing pivot data.
     * @param data
     * @param exists
     * @returns {RecipeIngredientPivot}
     */
    private createOrHydratePivot(data:any, exists:boolean = false):RecipeIngredientPivot {
        return new RecipeIngredientPivot(data._pivot);
    }

}

