import * as angular from "angular";
import * as _ from "lodash";
import User from "./user/userModel";
import Meta from "./meta/metaModel";
import SpiraException from "../../exceptions";
import momentDate from "../libs/moment/momentDate";
import {momentExtended as moment} from "../../common/libs/moment/moment";
import {Dictionary} from "~lodash/index";

let uuid:any = require("uuid");  //Webpack can't find the module with  import syntax - import * as uuid from "uuid";

export interface IModel {
    getAttributes(includeUnderscoredKeys?:boolean):Object;
    setExists(exists:boolean):void;
    exists():boolean;
}

export interface IModelClass {
    new(data?:any, exists?:boolean):IModel;
}

export interface IModelFactory {
    (data:any, exists?:boolean):IModel;
}

export interface IHydrateFunction {
    (data:any, exists:boolean):any;
}

export interface INestedEntityMap {
    [key:string]:IModelClass | IHydrateFunction;
}

export interface IAttributeCastFunction {
    (value:any):any;
}

export interface IAttributeCastMap {
    [key:string]:IAttributeCastFunction;
}

export interface IMetaableModel extends AbstractModel {
    _metas:Meta[];
}

export interface IPermalinkableModel extends AbstractModel {
    permalink:string;
}

export interface IAuthoredModel extends AbstractModel {
    authorId:string;
    _author:User;
    authorOverride:string;
    authorWebsite:string;
}

export interface IShortlinkableModelStatic {
    new(data?:any, exists?:boolean):AbstractModel;
    __shortcode:string;
}

//@todo make default export when https://github.com/Microsoft/TypeScript/issues/3792 is fixed
export abstract class AbstractModel implements IModel {

    protected __nestedEntityMap:INestedEntityMap;
    protected __attributeCastMap:IAttributeCastMap;
    private __exists:boolean;
    protected __primaryKey:string;

    constructor(data?:any, exists:boolean = false) {
        this.hydrate(data, exists);
    }

    /**
     * Assign the properties of the model from the init data
     * @param data
     * @param exists
     */
    protected hydrate(data:any, exists:boolean) {

        Object.defineProperty(this, "__exists", <PropertyDescriptor>{
            enumerable: false,
            writable: true,
            value: exists,
        });

        if (_.isObject(data)) {

            _.assign(this, data);

            _.forIn(this.__attributeCastMap, (caster:IAttributeCastFunction, accessor:string) => {
                _.has(this, accessor) && _.set(this, accessor, caster.call(this, _.get(data, accessor)));
            });

            if (!_.isEmpty(this.__nestedEntityMap)) {
                this.hydrateNested(data, exists);
            }
        }

    }

    /**
     * Converts a moment object
     * @param value
     * @returns {Moment}
     */
    protected castMoment(value:string):moment.Moment {

        if (!value) {
            return null; // Do not pass back an invalid moment object
        }

        return moment(value);
    }

    /**
     * Converts a momentDate object
     * @param value
     * @returns {MomentDate}
     */
    protected castMomentDate(value:string):momentExtended.MomentDate {

        if (!value) {
            return null; // Do not pass back an invalid moment object
        }

        return momentDate(value);
    }

    /**
     * Converts a time string to a moment duration object
     * @param value
     * @returns {moment.Duration}
     */
    protected castTime(value:string):moment.Duration {
        return moment.duration(value);
    }

    /**
     * Converts to a number
     * @param value
     * @returns {Number}
     */
    protected castNumber(value:any):Number {
        return Number(value);
    }

    /**
     * Converts to a boolean
     * @param value
     * @returns {Number}
     */
    protected castBoolean(value:string):Boolean {
        if (!value) {
            return null;
        }
        if (_.indexOf(['yes', 'true'], _.lowerCase(value)) >= 0) {
            return true;
        } else if (_.indexOf(['no', 'false'], _.lowerCase(value)) >= 0) {
            return false;
        } else {
            return null;
        }
    }

    /**
     * Checks to see if an entity implements interface IModelClass.
     *
     * @param entity
     */
    private isModelClass(entity:any):entity is IModelClass {
        return entity && entity.prototype && entity.prototype instanceof AbstractModel;
    }

    /**
     * Find all the nested entities and hydrate them into model instances
     * @param data
     * @param exists
     */
    protected hydrateNested(data:any, exists:boolean) {

        _.forIn(this.__nestedEntityMap, (nestedObject:IModelClass|IHydrateFunction, nestedKey:string) => {

            let nestedData = this[nestedKey]; // Default to what the default model is defined in the model

            if (this.isModelClass(nestedObject)) {
                if (_.has(data, nestedKey) && !_.isNull(data[nestedKey])) {
                    if (_.isArray(data[nestedKey])) {
                        nestedData = _.map(data[nestedKey], (entityData) => this.hydrateModel(entityData, (<IModelClass>nestedObject), exists));
                    } else if (_.isObject(data[nestedKey])) {
                        nestedData = this.hydrateModel(data[nestedKey], (<IModelClass>nestedObject), exists);
                    }
                }
            }
            else if (_.isFunction(nestedObject)) {
                nestedData = (<IHydrateFunction>nestedObject).call(this, data, exists);
            } else {
                throw new SpiraException('Nested object must be model class or function');
            }

            this[nestedKey] = nestedData;

        });

    }

    /**
     * Get a new instance of a model from data
     * @param data
     * @param Model
     * @returns {AbstractModel}
     * @param exists
     */
    protected hydrateModel(data:any, Model:IModelClass, exists:boolean) {
        return new Model(data, exists);
    }

    /**
     * Get all enumerable attributes of the model, by default excluding all keys starting with an _underscore
     * Underscored keys generally represent a relationship ie an instance of a model, or an array of instances
     * @param includeUnderscoredKeys
     * @param ignoreProperties
     * @returns {any}
     */
    public getAttributes(includeUnderscoredKeys:boolean = false, ignoreProperties:string[] = []):Object|Dictionary<any> {

        let allAttributes = angular.extend({}, this);

        let attributes = _.omitBy(allAttributes, (value, key) => {
            return _.startsWith(key, '__') || _.includes(ignoreProperties, key);
        });

        if (includeUnderscoredKeys) {
            return attributes;
        }

        return _.omitBy(attributes, (value, key) => {
            return _.startsWith(key, '_');
        });

    }

    /**
     * Get if the model exists in remote api
     * @returns {boolean}
     */
    public exists():boolean {
        return this.__exists;
    }

    /**
     * Set if the model exists
     * @param exists
     */
    public setExists(exists:boolean):void {
        this.__exists = exists;
    }

    /**
     * Generates a UUID using lil:
     * https://github.com/lil-js/uuid
     * @returns {string}
     */
    public static generateUUID():string {
        return uuid.v4();
    }

    /**
     * Get the model primary key name
     * @returns {string}
     */
    public getKeyName():string {
        return this.__primaryKey;
    }

    /**
     * Get the model primary key value
     * @returns {string}
     */
    public getKey():string {

        return this[this.getKeyName()];
    }

    /**
     * Change text into a slug
     */
    public slugify(original:string):string {

        let result = original;
        result = result.trim().toLowerCase(); // remove case and leading/trailer space
        result = result.replace(/[\W_]+/g," "); // deal with alphanumeric and underscore
        result = result.replace(/[-\s]+/g, '-'); // convert spaces
        result = result.replace(/^-|-$/g, ''); // remove leading/trailing separator

        return result;
    }
}




