import * as angular from "angular";
import * as _ from "lodash";
import SpiraException from "../../../exceptions";
import {IModelFactory, IModel} from "../../models/abstractModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";

export const namespace = 'common.services.pagination';

export class PaginatorException extends SpiraException {
}

export interface IRangeHeaderData {
    entityName:string;
    from:number;
    to:number;
    count:number|string;
}

export interface ICachedRequest {
    [key:string]:ng.IPromise<any>
}

export interface ISearch {
    [key:string]:any;
}

export class Paginator {

    private static defaultCount:number = 10;

    private count:number = Paginator.defaultCount;
    protected currentIndex:number = 0;
    private modelFactory:IModelFactory;
    private queryString:string = '';
    private queryStringEncoded:boolean = false;
    private withNested:string = null;
    private similarTo:string = '';
    private doCache:boolean = false;

    public entityCountTotal:number;
    private search:ISearch = null;

    constructor(protected url:string,
                protected paginationServiceInstance:PaginationService,
                protected ngRestAdapter:NgRestAdapterService,
                protected $q:ng.IQService,
                protected $window:ng.IWindowService) {

        this.modelFactory = (data:any, exists:boolean) => data; //set a default factory that just returns the data

    }

    /**
     * Set child entities to retrieve with entity.
     * @param nestedEntities
     * @returns {Paginator}
     */
    public setNested(nestedEntities:string[]):Paginator {

        if (!_.isNull(nestedEntities)) {
            this.withNested = nestedEntities.join(', ');
        }
        return this;

    }

    /**
     * Turn on (or off) request caching
     * @param doCache
     */
    public cacheRequests(doCache:boolean = true):Paginator {
        this.doCache = doCache;
        return this;
    }

    /**
     * Clear the cache
     */
    public bustCache() {
        this.paginationServiceInstance.bustCache();
        return this;
    }

    /**
     * Method to test when to skip the interceptor
     * @param rejection
     * @returns {boolean}
     */
    private static conditionalSkipInterceptor(rejection:ng.IHttpPromiseCallbackArg<any>):boolean {

        return _.includes([416, 404], rejection.status);
    }

    /**
     * Build the range header
     * @param from
     * @param to
     */
    private static getRangeHeader(from:number, to:number):string {
        return 'entities=' + from + '-' + to;
    }

    /**
     * scenario
     * 34 entities
     * request 30 - 34
     * count 5
     */

    /**
     * Get the response from the collection endpoint
     * @param count
     * @param index
     */
    protected getResponse(count:number, index:number = this.currentIndex):ng.IPromise<IModel[]> {

        if (this.entityCountTotal && index >= this.entityCountTotal) {
            return this.$q.reject(new PaginatorException("No more results found!"));
        }

        let last = index + count - 1;
        if (this.entityCountTotal && last >= this.entityCountTotal) {
            last = this.entityCountTotal - 1;
        }

        let headers:ng.HttpHeaderType = {
            Range: Paginator.getRangeHeader(index, last)
        };

        let url = this.url;
        if (!_.isEmpty(this.queryString)) {
            url += '/search?q=' + this.queryString;
            if (this.queryStringEncoded) {
                headers['Base64-Encoded-Fields'] = 'q';
            }
        }

        if (!_.isEmpty(this.search) && _.isEmpty(this.queryString)) {

            let searchString = _.reduce(this.search, (res, value, key) => {
                res.push(key + '=' + (<any>this.$window).encodeURIComponent(value));
                return res;
            }, []).join('&');

            url += '?' + searchString;
        }

        if (!_.isEmpty(this.similarTo)) {
            url += '/' + this.similarTo + '/similar';
        }

        if (!_.isNull(this.withNested)) {
            headers['With-Nested'] = this.withNested;
        }

        return this.doRequest(url, headers).then((response:ng.IHttpPromiseCallbackArg<any>) => {
            this.processContentRangeHeader(response.headers);
            return _.map(response.data, (modelData) => this.modelFactory(modelData, true));
        }).catch((response:ng.IHttpPromiseCallbackArg<any>) => {

            let errorMessage;
            if (response.status == 404) { //no content
                this.entityCountTotal = 0;
                errorMessage = "Search returned no results!";
            } else if (response.status == 403) { //no permissions
                errorMessage = "Unable to access content";
            } else {
                errorMessage = "No more results found!";
            }

            return this.$q.reject(new PaginatorException(errorMessage));
        });

    }

    public doRequest(url:string, headers:ng.HttpHeaderType):ng.IPromise<any> {

        let requestHash = url + ':' + angular.toJson(headers);

        if (this.doCache && _.has(this.paginationServiceInstance.cachedRequests, requestHash)) {
            return this.paginationServiceInstance.cachedRequests[requestHash];
        }

        let request = this.ngRestAdapter
            .skipInterceptor(Paginator.conditionalSkipInterceptor)
            .get(url, headers);

        if (this.doCache) {
            this.paginationServiceInstance.cachedRequests[requestHash] = request;
        }

        return request;
    }

    /**
     * Return an array of numbers which indicates how many pages of results there are.
     * @returns {number[]}
     */
    public getPages():number[] {

        return _.range(1, Math.ceil(this.entityCountTotal / this.getCount()) + 1);

    }

    /**
     * Set the search parameters
     * @param search
     * @returns {Paginator}
     */
    public setSearch(search:ISearch):this {
        this.search = search;

        return this;
    }

    /**
     * Set the index back to 0 and get a response from the collection endpoint with added query param. If an empty
     * string is passed through the results are not filtered.
     * @param query
     * @returns {IPromise<TResult>}
     */
    public query(query:string):ng.IPromise<any[]> {

        this.reset();

        this.queryString = (<any>this.$window).encodeURIComponent(query);
        this.queryStringEncoded = false;

        return this.getResponse(this.count);

    }

    /**
     * Set the index back to 0 and get a response from the collection endpoint with added complex query param. If an empty
     * string is passed through the results are not filtered.
     * @param query
     * @returns {ng.IPromise<IModel[]>}
     */
    public complexQuery(query:any):ng.IPromise<any[]> {

        this.reset();

        this.queryString = btoa(angular.toJson(_.cloneDeep(query)));
        this.queryStringEncoded = true;

        return this.getResponse(this.count);

    }

    /**
     * Get a collection of similar entities to a given entity.
     * @param identifier
     * @returns {ng.IPromise<IModel[]>}
     */
    public getSimilar(identifier:string):ng.IPromise<any[]> {

        this.reset();

        this.similarTo = identifier;

        return this.getResponse(this.count);

    }

    /**
     * Set the default count to get responses
     * @param count
     * @returns {Paginator}
     */
    public setCount(count:number):Paginator {
        this.count = count;
        return this;
    }

    /**
     * Get the current count
     * @returns {number}
     */
    public getCount():number {
        return this.count;
    }

    /**
     * Get the next set of paginated results
     * @returns {IPromise<TResult>}
     * @param count
     */
    public getNext(count:number = this.count):ng.IPromise<any[]> {

        let responsePromise = this.getResponse(count);

        this.currentIndex += count;

        return responsePromise;
    }

    /**
     * Get results with traditional pagination page numbers (1 - indexed)
     * @param page
     */
    public getPage(page:number):ng.IPromise<any[]> {

        let first = this.count * (page - 1);

        let responsePromise = this.getResponse(this.count, first)
            // In the case where someone tries to navigate to a page which doesn't exist or there are no results.
            .catch(() => {
                return [];
            });

        this.currentIndex = first;

        return responsePromise;

    }

    /**
     * Set the index back to 0 or specified index value
     */
    public reset(index:number = 0):Paginator {
        this.currentIndex = index;
        this.queryString = '';
        this.queryStringEncoded = false;
        this.similarTo = '';
        this.entityCountTotal = null;
        this.search = null;

        return this;
    }

    /**
     * Get the a specific range
     * @returns {ng.IPromise<any[]>}
     * @param first
     * @param last
     */
    public getRange(first:number, last:number):ng.IPromise<any[]> {

        return this.getResponse(last - first + 1, first);
    }

    public setModelFactory(modelFactory:IModelFactory):Paginator {
        this.modelFactory = modelFactory;
        return this;
    }

    private processContentRangeHeader(headers:ng.IHttpHeadersGetter):void {
        let headerString = headers('Content-Range');

        if (!headerString) {
            return;
        }

        let headerParts = Paginator.parseContentRangeHeader(headerString);

        if (_.isNumber(headerParts.count)) {
            this.entityCountTotal = <number>headerParts.count;
        }
    }

    public static parseContentRangeHeader(headerString:String):IRangeHeaderData {
        let parts = headerString.split(/[\s\/]/);

        if (parts.length !== 3) {
            throw new PaginatorException("Invalid range header; expected pattern: `entities 1-10/50`, got `" + headerString + "`");
        }

        let rangeParts = parts[1].split('-');

        if (rangeParts.length !== 2) {
            throw new PaginatorException("Invalid range header; expected pattern: `entities 1-10/50`, got `" + headerString + "`");
        }

        let count:any = parts[2];
        if (!_.isNaN(Number(count))) {
            count = parseInt(count);
        }

        return {
            entityName: parts[0],
            from: parseInt(rangeParts[0]),
            to: parseInt(rangeParts[1]),
            count: count,
        }

    }
}

export default class PaginationService {

    public cachedRequests:ICachedRequest = {};

    static $inject:string[] = ['ngRestAdapter', '$q', '$window'];

    constructor(protected ngRestAdapter:NgRestAdapterService,
                protected $q:ng.IQService,
                protected $window:ng.IWindowService) {

    }

    /**
     * Get an instance of the Paginator
     * @param url
     * @returns {Paginator}
     */
    public getPaginatorInstance(url:string):Paginator {
        return new Paginator(url, this, this.ngRestAdapter, this.$q, this.$window);
    }

    /**
     * Clear the cache
     * @returns {PaginationService}
     */
    public bustCache() {
        this.cachedRequests = {};
        return this;
    }

}

angular.module(namespace, [])
    .service('paginationService', PaginationService);

