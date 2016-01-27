import {IAttributeCastMap, AbstractModel} from "../abstractModel";
import changeAware from "../../decorators/changeAware/changeAwareDecorator";

export interface IGenderOption {
    label:string;
    value:string;
}

@changeAware
export default class UserProfile extends AbstractModel {

    protected __primaryKey = 'userId';

    protected __attributeCastMap:IAttributeCastMap = {
        dob: this.castMomentDate,
    };

    public userId:string;
    public dob:momentExtended.MomentDate;
    public mobile:string;
    public phone:string;
    public gender:string;
    public about:string;
    public facebook:string;
    public twitter:string;
    public pinterest:string;
    public instagram:string;
    public website:string;
    public displayRole:string;

    public static genderOptions:IGenderOption[] = [
        {label: 'Male', value: 'M'},
        {label: 'Female', value: 'F'},
        {label: 'Prefer not to say', value: 'N/A'}
    ];

    constructor(data:any, exists:boolean = false) {

        super(data, exists);

        this.hydrate(data, exists);
    }

}

