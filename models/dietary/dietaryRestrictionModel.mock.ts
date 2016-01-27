import {AbstractMock} from "../abstractModel.mock";
import DietaryRestriction from "./dietaryRestrictionModel";
import {IModelClass} from "../abstractModel";
export default class DietaryRestrictionMock extends AbstractMock {

    private dietaryRestrictions = [
        new DietaryRestriction({name: 'Diary', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({name: 'Egg', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({name: 'Gluten', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({name: 'Nuts', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({
            name: 'Seafood',
            type: DietaryRestriction.allergenType
        }),
        new DietaryRestriction({
            name: 'Shellfish',
            type: DietaryRestriction.allergenType
        }),
        new DietaryRestriction({name: 'Soy', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({name: 'Wheat', type: DietaryRestriction.allergenType}),
        new DietaryRestriction({name: 'Vegetarian', type: DietaryRestriction.dietType}),
        new DietaryRestriction({name: 'Vegan', type: DietaryRestriction.dietType}),
        new DietaryRestriction({name: 'FODMAP', type: DietaryRestriction.dietType}),
        new DietaryRestriction({name: 'Paleo', type: DietaryRestriction.dietType}),
        new DietaryRestriction({name: 'Low Carb', type: DietaryRestriction.dietType})
    ];

    public getModelClass():IModelClass {
        return DietaryRestriction;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return seededChance.pick(this.dietaryRestrictions);

    }

    public static entity(overrides:Object = {}, exists:boolean = true):DietaryRestriction {
        return <DietaryRestriction> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):DietaryRestriction[] {
        return <DietaryRestriction[]>new this().buildCollection(count);
    }

}


