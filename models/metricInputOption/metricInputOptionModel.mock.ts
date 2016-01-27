import * as _ from "lodash";
import {AbstractMock} from "../abstractModel.mock";
import {IModelClass} from "../abstractModel";
import MetricInputOption from "./metricInputOptionModel";

export default class MetricInputOptionMock extends AbstractMock {

    public getModelClass():IModelClass {
        return MetricInputOption;
    }

    public getMockData():Object {

        let seededChance = new Chance();

        return {
            group: seededChance.word(),
            options: _.map(Array(seededChance.integer({min: 0, max: 5})), () => {
                return seededChance.word();
            })
        };

    }

    public static entity(overrides:Object = {}, exists:boolean = true):MetricInputOption {
        return <MetricInputOption> new this().buildEntity(overrides, exists);
    }

    public static collection(count:number = 10):MetricInputOption[] {
        return <MetricInputOption[]>new this().buildCollection(count);
    }

}

