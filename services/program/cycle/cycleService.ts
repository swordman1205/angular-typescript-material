import * as angular from "angular";
import * as _ from "lodash";
import ProgramOption from "../../../models/programOption/programOptionModel";
import {AbstractApiService, IExtendedApiService} from "../../abstractApiService";
import {TaggableApiService} from "../../../mixins/taggableApiService";
import applyMixins from "../../../mixins/mixins";
import {ProgramOptionalApiService} from "../../../mixins/programOptionalApiService";
import {TaggableModel} from "../../../mixins/taggableModel";
import Tag from "../../../models/tag/tagModel";
import {ProgramOptionalModel} from "../../../mixins/programOptionalModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../../pagination/paginationService";
import Cycle, {IPeriodInfo} from "../../../models/cycle/cycleModel";
import Program from "../../../models/program/programModel";
import {ISchedulePeriod} from "../schedule/scheduleService";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import momentDate from "../../../libs/moment/momentDate";
import ProgramRatePlan from "../../../models/programRatePlan/programRatePlan";
import ZuoraInvoice from "../../../models/zuoraInvoice/zuoraInvoiceModel";

export const namespace = 'cycle';

// export interface IProgramOptionSelected {
//     programOption:ProgramOption;
//     selected:boolean;
// }

// export interface IProgramOptionType {
//     type:ProgramOptionType;
//     programOptions:IProgramOptionSelected[];
// }

export interface IGetInvoiceBody {
    promoCode:string,
    currency:string,
    country:string,
    state?:string
}

export default class CycleService extends AbstractApiService implements TaggableApiService, IExtendedApiService, ProgramOptionalApiService {

    // TaggbleApiService
    public saveEntityTags:(entity:TaggableModel) => ng.IPromise<Tag[]|boolean>;

    // ProgramOptionalApiService
    public saveEntityProgramOptions:(entity:ProgramOptionalModel) => ng.IPromise<ProgramOption[]|boolean>;

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Cycle given data
     * @param data
     * @returns {Cycle}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Cycle {
        return new Cycle(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @returns {string}
     * @param cycle
     */
    public apiEndpoint(cycle?:Cycle):string {
        if (cycle) {
            return '/cycles/' + cycle.getKey();
        }
        return '/cycles';
    }

    /**
     * Get a new recipe with no values and a set uuid
     * @returns {Recipe}
     */
    public newCycle(program:Program):Cycle {

        let today = momentDate();

        return new Cycle({
            programCycleId: this.ngRestAdapter.uuid(),
            programId: program.programId,
            scheduleOnSaleStart: today,
            scheduleOnSaleEnd: today,
            periodOneStartDate: today,
            generalAccessStart: today,
            forumEnabled: true,
        });

    }

    /**
     * Save updated period info.
     *
     * @param cycle
     * @param period
     */
    public savePeriodInfo(cycle:Cycle, period:ISchedulePeriod):ng.IPromise<Cycle> {

        let periodToModify = _.find(cycle.periodInfo, (periodInfo:IPeriodInfo) => {
            return periodInfo.index == period.periodIndex;
        });

        if (periodToModify) { // Replace
            periodToModify.index = period.periodIndex;
            periodToModify.name = period.periodName;
            periodToModify.info = period.periodInfo;
        }
        else { // Add
            cycle.periodInfo.push(<IPeriodInfo>{
                index: period.periodIndex,
                name: period.periodName,
                info: period.periodInfo
            });
        }

        return this.saveModel(cycle)
            .then(() => {
                (<IChangeAwareDecorator>cycle).resetChanged();
                cycle.setExists(true);
                return cycle;
            });

    }

    /**
     * Save with all the nested entities too
     * @param cycle
     * @returns {IPromise<Cycle>}
     */
    public save(cycle:Cycle):ng.IPromise<Cycle> {
        return this.saveModel(cycle)
            .then(() => this.$q.all([
                this.saveRelatedEntities(cycle),
                //this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>cycle).resetChanged(); //reset so next save only saves the changed ones
                cycle.setExists(true);
                return cycle;
            });

    }

    /**
     * Get all program options for a cycle.
     * @param cycle
     * @returns {IPromise<ProgramOption[]>}
     */
    public getCycleOptions(cycle:Cycle):ng.IPromise<ProgramOption[]> {

        return this.ngRestAdapter
            .get(this.apiEndpoint(cycle) + '/options', {
                'With-Nested': 'programOptionType'
            })
            .then((res) =>
                _.map(res.data, (modelData) => {
                    return new ProgramOption(modelData, true);
                })
            );

    }

    /**
     * Create a new cycle from 'cycle' and copy items from cycle 'cycleItemsToCopy'.
     *
     * @param cycle
     * @param copyItemsFromCycle
     * @returns {IPromise<ProgramOption[]>}
     */
    public duplicateCycle(cycle:Cycle, copyItemsFromCycle:Cycle):ng.IPromise<Cycle> {

        return this.ngRestAdapter
            .put(this.apiEndpoint(cycle) + '/scheduled-items/copy-from-cycle/' + copyItemsFromCycle.getKey(), cycle.getAttributes())
            .then(() => {
                return cycle;
            });

    }

    /**
     * Apply promo code to rate plan and get invoice.
     *
     * @param cycle
     * @param ratePlan
     * @param promoCode
     * @param currency
     * @param country
     * @param state
     * @returns {IPromise<TResult>}
     */
    public getInvoice(cycle:Cycle, ratePlan:ProgramRatePlan, promoCode:string, currency:string, country:string, state:string = null):ng.IPromise<ZuoraInvoice> {

        return this.ngRestAdapter
            .skipInterceptor()
            .post(this.apiEndpoint(cycle) + '/pricing/rate-plans/' + ratePlan.ratePlanId, <IGetInvoiceBody>{
                promoCode: promoCode,
                currency: currency,
                country: country,
                state: state
            })
            .then((res) => {
                return new ZuoraInvoice(res.data);
            });

    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:Cycle):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntityTags(entity),
            this.saveAmbassadors(entity),
            this.saveExperts(entity),
            this.saveEntityProgramOptions(entity),
        ]);

    }

    /**
     * Sync all ambassadors.
     * @param entity
     * @returns {any}
     */
    private saveAmbassadors(entity:Cycle):ng.IPromise<any> {

        if (!_.has((<IChangeAwareDecorator>entity).getChanged(true), '_ambassadors')) {
            return this.$q.when(false);
        }

        let requestObject = this.getNestedCollectionRequestObject(entity, '_ambassadors', false, false);

        return this.ngRestAdapter.put(this.apiEndpoint(entity) + '/ambassadors', requestObject)
            .then(() => {
                return entity._ambassadors;
            });

    }

    /**
     * Sync all saveExperts.
     * @param entity
     * @returns {any}
     */
    private saveExperts(entity:Cycle):ng.IPromise<any> {

        if (!_.has((<IChangeAwareDecorator>entity).getChanged(true), '_experts')) {
            return this.$q.when(false);
        }

        let requestObject = this.getNestedCollectionRequestObject(entity, '_experts', false, false);

        return this.ngRestAdapter.put(this.apiEndpoint(entity) + '/experts', requestObject)
            .then(() => {
                return entity._experts;
            });

    }

}

applyMixins(CycleService, [TaggableApiService, ProgramOptionalApiService]);

angular.module(namespace, [])
    .service('cycleService', CycleService);





