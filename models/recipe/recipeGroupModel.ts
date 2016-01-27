import * as _ from "lodash";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";
import {AbstractModel, INestedEntityMap} from "../abstractModel";
import Recipe from "./recipeModel";
import Direction from "../direction/directionModel";
import RecipeIngredient from "./recipeIngredientModel";

export interface IGroupOrder {
    ingredients:string[];
    directions:string[];
}

@changeAware
export default class RecipeGroup extends AbstractModel {

    protected __primaryKey:string = 'groupId';

    protected __nestedEntityMap:INestedEntityMap = {
        _recipe: Recipe,
    };

    public groupId:string;
    public entityOrder:IGroupOrder;
    public name:string;
    public recipeId:string;

    public _recipe:Recipe;
    public __ingredients:RecipeIngredient[] = [];
    public __directions:Direction[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

    public updateSort():void {

        if (!_.isObject(this.entityOrder)) {
            this.entityOrder = {
                directions: null,
                ingredients: null,
            };
        }

        this.entityOrder.ingredients = _.map<RecipeIngredient, string>(this.__ingredients, 'ingredientId');
        this.entityOrder.directions = _.map<Direction, string>(this.__directions, 'directionId');
    }

    public reset():void {
        this.__ingredients = [];
        this.__directions = [];
    }
}

