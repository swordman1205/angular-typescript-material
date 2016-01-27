import * as _ from "lodash";
import CycleScheduleItem from "./cycleScheduleItemModel";
import {IModelClass} from "../abstractModel";
import {AbstractMock} from "../abstractModel.mock";
import ProgramPostMock from "../post/programPost/programPostModel.mock";

export default class CycleScheduleItemMock extends AbstractMock {

    public getModelClass():IModelClass {
        return CycleScheduleItem;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            cycleScheduleItemId: seededChance.guid(),
            programCycleId: seededChance.guid(),

            scheduledItemId: seededChance.guid(),
            scheduledItemType: null,
            periodIndex: null,
            scheduledRelativeTo: null,
            scheduledRelativeToPeriodDays: null,
            scheduleDate: null,
            scheduleTime: null,
            stickyInFeed: null,
            feedFormat: seededChance.pick(_.keys(new CycleScheduleItem({}).__formatOptionsMap)),

            _scheduledItem: ProgramPostMock.entity(),
            _options: []
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):CycleScheduleItem {
        return <CycleScheduleItem> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10, overrides:Object = {}, exists:boolean = true):CycleScheduleItem[] {
        return <CycleScheduleItem[]>new this().buildCollection(count, overrides, exists);
    }

}

