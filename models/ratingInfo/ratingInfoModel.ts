import {AbstractModel} from "../abstractModel";
export default class RatingInfo extends AbstractModel {

    protected __primaryKey = 'rateableId';

    public rateableId:number;
    public count:number;
    public averageRating:number;
    public __roundedRating:number;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);

        this.__roundedRating = this.getRounded();
    }

    public getRounded(toNearest:number = 0.5):number {
        return Number((Math.round(this.averageRating / toNearest) * toNearest).toFixed(12)); //The toFixed(12) deals with floating point errors
    }

}
