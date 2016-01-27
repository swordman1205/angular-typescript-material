import * as _ from "lodash";
import {IModelClass, IModel} from "./abstractModel";

export interface IMock {
    getModelClass():IModelClass;
    getMockData():Object;
}

export interface IMockStatic {
    new():IMock;
    entity(overrides?:Object, exists?:boolean):IModel;
    collection(count?:number, overrides?:Object, exists?:boolean):IModel[]
}

//@todo make default export when https://github.com/Microsoft/TypeScript/issues/3792 is fixed
export abstract class AbstractMock implements IMock {

    public abstract getMockData(overrides?:Object):Object;

    public abstract getModelClass():IModelClass;

    public buildEntity<T extends IModel>(overrides:Object = {}, exists:boolean = true):T {

        let data:any = this.getMockData(overrides);
        let modelClass = this.getModelClass();

        return <T> new modelClass(_.merge(data, overrides), exists);
    }

    public buildCollection<T extends IModel>(count:number = 10, overrides:Object = {}, exists:boolean = true):T[] {

        return chance.unique(() => this.buildEntity<T>(overrides, exists), count);
    }

}

