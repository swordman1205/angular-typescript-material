import {AbstractModel, INestedEntityMap} from "../abstractModel";
import ProgramOption from "../programOption/programOptionModel";
export default class ProgramOptionType extends AbstractModel {

    protected __primaryKey = 'programOptionTypeId';

    protected __nestedEntityMap:INestedEntityMap = {
        _programOptions: ProgramOption
    };

    public programOptionTypeId:string;
    public type:string;

    public _programOptions:ProgramOption[] = [];

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

