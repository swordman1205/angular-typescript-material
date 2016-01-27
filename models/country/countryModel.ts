import {AbstractModel, INestedEntityMap} from "../abstractModel";
import Timezone from "../timezone/timezoneModel";

export default class Country extends AbstractModel {

    public countryName:string;
    public countryCode:string;
    public timezones:Timezone[] = [];

}