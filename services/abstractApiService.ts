import * as _ from "lodash";
import {CategoryTag} from "../models/tag/tagModel";
import {IModel, AbstractModel} from "../models/abstractModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {Paginator, default as PaginationService} from "./pagination/paginationService";
import {ISpiraState} from "../../interfaces.ts";
import {IChangeAwareDecorator} from "../decorators/changeAware/changeAwareDecorator";

export interface IExtendedApiService extends AbstractApiService {
    save?(entity):ng.IPromise<any>;
    getPublicUrl?(entity):string;
}

export interface IQueuedSaveProcess {
    ():ng.IPromise<any>;
}

//@todo make default export when https://github.com/Microsoft/TypeScript/issues/3792 is fixed
export abstract class AbstractApiService {

    protected queuedSaveProcessFunctions:IQueuedSaveProcess[] = [];
    protected cachedPaginator:Paginator;

    public cachedCategoryTagPromise:ng.IPromise<CategoryTag[]>;

    private interceptingNgRestAdapterService:NgRestAdapterService = null;

    constructor(protected ngRestAdapter:NgRestAdapterService,
                protected paginationService:PaginationService,
                protected $q:ng.IQService,
                protected $location:ng.ILocationProvider,
                protected $state:ng.ui.IStateService) {
    }

    protected abstract modelFactory(data:any, exists?:boolean):IModel;

    public abstract apiEndpoint(entity?:IModel):string;

    public clearCachedPaginator():this {
        this.cachedPaginator = null;
        return this;
    }

    /**
     * Get the paginator
     * @param nestedEntities string[]
     * @param endpoint
     * @returns {Paginator}
     */
    public getPaginator(nestedEntities:string[] = null, endpoint:string = this.apiEndpoint()):Paginator {

        if (!this.cachedPaginator) {
            this.cachedPaginator = this.paginationService
                .getPaginatorInstance(endpoint)
                .setModelFactory(this.modelFactory)
                .setNested(nestedEntities);
        }
        else {
            // We should reset the paginator each time we use it in case
            // the last time it was used was for a query (the total entity
            // count will be less than expected).
            this.cachedPaginator.reset();
        }

        return this.cachedPaginator;
    }

    /**
     * Returns the public url for a given entity given it's (public) configuration state and params.
     * You should extend this function in your service.
     * @param params
     * @param state
     * @returns {string}
     */
    protected getPublicUrlForEntity(params:any, state:ISpiraState):string {

        // @Todo: Typings for $location and $state are not up to date
        return (<any>this.$location).protocol() + '://' + (<any>this.$location).host() + (<any>this.$state).href(state, params);

    }

    /**
     * Get model given an identifier (uuid or permalink)
     * @param identifier
     * @param withNested
     * @returns {ng.IPromise<T>}
     * @param endpointOverride
     * @param skipInterceptor
     */
    public getModel<T extends AbstractModel>(identifier:string, withNested:string[] = null, endpointOverride:string = null, skipInterceptor:boolean = false):ng.IPromise<T> {

        let endpoint = endpointOverride ? endpointOverride : this.apiEndpoint() + '/' + identifier;

        return this.ngRestAdapter
            .skipInterceptor(() => skipInterceptor)
            .get(endpoint, {
                'With-Nested': () => {
                    if (!withNested) {
                        return null;
                    }
                    return withNested.join(', ');
                }
            })
            .then((res:ng.IHttpPromiseCallbackArg<T>) => this.modelFactory(res.data, true));
    }

    /**
     * Get all instances of a model
     * Usually a paginator should be used, but sometimes the entire dataset is required
     * @param withNested
     * @returns {ng.IPromise<T[]>}
     * @param endpoint
     * @param skipInterceptor
     */
    public getAllModels<T extends AbstractModel>(withNested:string[] = null, endpoint:string = this.apiEndpoint(), skipInterceptor:boolean = false):ng.IPromise<T[]> {

        return this.ngRestAdapter
            .skipInterceptor(() => skipInterceptor)
            .get(endpoint, {
                'With-Nested': () => {
                    if (!withNested) {
                        return null;
                    }
                    return withNested.join(', ');
                }
            })
            .then((res:ng.IHttpPromiseCallbackArg<T[]>) => _.map(res.data, (modelData) => this.modelFactory(modelData, true)));
    }

    /**
     * Save model given the entity and endpoint
     * @todo swap params to follow common pattern of rest adapter
     * @param entity
     * @returns {any}
     * @param endpoint
     */
    public saveModel<T extends AbstractModel>(entity:T, endpoint:string = this.apiEndpoint(entity)):ng.IPromise<T|boolean> {
        let method = entity.exists() ? 'patch' : 'put';

        let saveData = entity.getAttributes();

        if (entity.exists()) {
            saveData = (<IChangeAwareDecorator>entity).getChanged();
        }

        if (_.size(saveData) == 0) { // If there is nothing to save, don't make an API call
            return this.$q.when(true);
        }

        return this.ngRestAdapter[method](endpoint, saveData)
            .then(() => entity);

    }

    /**
     * Remove a model given the entity
     * @param entity
     * @returns {ng.IHttpPromise<any>}
     */
    public removeModel<T extends AbstractModel>(entity:T):ng.IPromise<T|boolean> {

        return this.ngRestAdapter.remove(this.apiEndpoint(entity));

    }

    /**
     * Get the nested attributes ready for save. Returns empty array if there is nothing to save
     * @param entity
     * @param nestedKey
     * @param getPartial
     * @returns {any}
     * @param filterExisting
     * @param alwayIncludeProperties
     * @param ignoreProperties
     */
    public getNestedCollectionRequestObject(entity:AbstractModel, nestedKey:string, getPartial:boolean = true, filterExisting:boolean = true, alwayIncludeProperties:string[] = null, ignoreProperties:string[] = []):Object[] {

        let nestedCollection:AbstractModel[] = _.get(entity, nestedKey, null);

        //if there is no nested attributes or it is an empty array, return
        if (!nestedCollection || _.isEmpty(nestedCollection)) {
            return [];
        }

        let nestedResponseObjects = _.chain(<AbstractModel[]>nestedCollection)
            .filter((nestedModel:AbstractModel) => {
                if (!filterExisting) {
                    return true;
                }

                if (!nestedModel.exists()) {
                    return true;
                }

                let changedProperties = (<IChangeAwareDecorator>nestedModel).getChanged(true, ignoreProperties);

                //filter out the existing models with no changes
                return _.size(changedProperties) > 0;
            })
            .map((nestedModel:AbstractModel) => {
                if (getPartial && nestedModel.exists()) {
                    //return the partial changes
                    return _.merge((<IChangeAwareDecorator>nestedModel).getChanged(true, ignoreProperties), _.pick(nestedModel, alwayIncludeProperties));
                }
                //return all the attributes
                return nestedModel.getAttributes(true, ignoreProperties);
            })
            .value();

        //if after filtering there is no changes, exit.
        if (_.isEmpty(nestedResponseObjects)) {
            return [];
        }
        return nestedResponseObjects;

    }

    /**
     * Run all queued save functions, returning promise of success
     * @returns {IPromise<TResult>}
     */
    protected runQueuedSaveFunctions():ng.IPromise<any> {

        let promises = _.map(this.getQueuedSaveProcessFunctions(), (queuedSaveFunction:IQueuedSaveProcess) => queuedSaveFunction());

        this.dumpQueueSaveFunctions();

        return this.$q.all(promises);
    }

    /**
     * Get all the queued save functions
     * @returns {IQueuedSaveProcess[]}
     */
    protected getQueuedSaveProcessFunctions():IQueuedSaveProcess[] {
        return this.queuedSaveProcessFunctions;
    }

    /**
     * Add a new queued save function
     * @param fn
     */
    public addQueuedSaveProcessFunction(fn:IQueuedSaveProcess):void {
        this.queuedSaveProcessFunctions.push(fn);
    }

    /**
     * Clear all queued save functions
     */
    public dumpQueueSaveFunctions():void {
        this.queuedSaveProcessFunctions = [];
    }

    public suppressInterceptor():this {

        this.interceptingNgRestAdapterService = this.ngRestAdapter;
        this.ngRestAdapter = this.ngRestAdapter.skipInterceptor();

        return this;
    }

    public restoreInterceptor():this {
        this.ngRestAdapter = this.interceptingNgRestAdapterService;
        this.interceptingNgRestAdapterService = null;

        return this;
    }

}





