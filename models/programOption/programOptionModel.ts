import {AbstractModel, INestedEntityMap, IAttributeCastMap} from "../abstractModel";
import ProgramOptionType from "../programOptionType/programOptionTypeModel";
export interface IProgramOptionPivot {
    cycleScheduleItemId:string;
    programOptionId:string;
}

export default class ProgramOption extends AbstractModel {

    protected __primaryKey:string = 'programOptionId';

    public programOptionId:string = undefined;
    public programOptionTypeId:string = undefined;
    public name:string = undefined;

    protected __nestedEntityMap:INestedEntityMap = {
        _programOptionType: ProgramOptionType
    };

    protected __attributeCastMap:IAttributeCastMap = {
        createdAt: this.castMoment,
        updatedAt: this.castMoment,
    };

    public _pivot:IProgramOptionPivot;
    public _programOptionType:ProgramOptionType;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}




