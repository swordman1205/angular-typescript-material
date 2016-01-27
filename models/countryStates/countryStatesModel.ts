import {AbstractModel, INestedEntityMap} from "../abstractModel";
import Timezone from "../timezone/timezoneModel";
import State from "../state/stateModel";

export default class CountryStates extends AbstractModel {

    public country:string;
    public states:State[] = [];

}