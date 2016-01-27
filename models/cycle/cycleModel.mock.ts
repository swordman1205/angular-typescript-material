import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import Cycle from "./cycleModel";
import momentDate from "../../libs/moment/momentDate";
export default class CycleMock extends AbstractMock {

    public getModelClass():IModelClass {
        return Cycle;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        let startDate = momentDate();

        return {
            programCycleId: seededChance.guid(),
            cycleKey: chance.word({syllables: 3}),
            programId: seededChance.guid(),
            name: seededChance.word(),
            memberCount: seededChance.integer({min: 0, max: 10000}),
            scheduleOnSalePreSaleDays: seededChance.integer({min: 0, max: 10}),
            scheduleOnSaleStart: startDate.clone(),
            scheduleOnSaleEnd: startDate.add(seededChance.integer({min: 0, max: 5}), 'days').clone(),
            scheduleOnSalePostSaleDays: seededChance.integer({min: 0, max: 3}),
            periodOneStartDate: startDate.add(seededChance.integer({min: 0, max: 5}), 'days').clone(),
            postSeasonDays: seededChance.integer({min: 0, max: 14}),
            generalAccessStart: startDate.add(seededChance.integer({min: 0, max: 5}), 'days').clone(),
            forumRoleName: null,
            forumCategoryName: null,
            forumCommentsTarget: null,
            periodInfo: null,
            mealPeriodEarlyAccessDays: 3
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):Cycle {
        return <Cycle> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):Cycle[] {
        return <Cycle[]>new this().buildCollection(count, overrides, exists);
    }

}

