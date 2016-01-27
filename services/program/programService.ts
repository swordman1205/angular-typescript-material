import * as angular from "angular";
import * as _ from "lodash";
import {TaggableApiService} from "../../mixins/taggableApiService";
import applyMixins from "../../mixins/mixins";
import ProgramOptionType from "../../models/programOptionType/programOptionTypeModel";
import ProgramOption from "../../models/programOption/programOptionModel";
import {TCycleStage, default as Cycle} from "../../models/cycle/cycleModel";
import {AbstractApiService, IExtendedApiService} from "../abstractApiService";
import {ProgramOptionalApiService} from "../../mixins/programOptionalApiService";
import {TaggableModel} from "../../mixins/taggableModel";
import Tag from "../../models/tag/tagModel";
import {ProgramOptionalModel} from "../../mixins/programOptionalModel";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../pagination/paginationService";
import {IChangeAwareDecorator} from "../../decorators/changeAware/changeAwareDecorator";
import ProgramRatePlan from "../../models/programRatePlan/programRatePlan";
import Program from "../../models/program/programModel";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export const namespace = 'common.services.program';

export const STAGE_FUTURE:TCycleStage = 'Future';
export const STAGE_PRE_SEASON:TCycleStage = 'Pre Season';
export const STAGE_IN_PROGRESS:TCycleStage = 'In Progress';
export const STAGE_POST_SEASON:TCycleStage = 'Post Season';
export const STAGE_END:TCycleStage = 'Ended';

export default class ProgramService extends AbstractApiService implements TaggableApiService, IExtendedApiService, ProgramOptionalApiService {

    // TaggbleApiService
    public saveEntityTags:(entity:TaggableModel) => ng.IPromise<Tag[]|boolean>;

    // ProgramOptionalApiService
    public saveEntityProgramOptions:(entity:ProgramOptionalModel) => ng.IPromise<ProgramOption[]|boolean>;

    public cachedProgramOptionTypesPromise:ng.IPromise<ProgramOptionType[]>;

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService) {
        super(ngRestAdapter, paginationService, $q, $location, $state);
    }

    /**
     * Get an instance of the Program given data
     * @param data
     * @returns {Program}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):Program {
        return new Program(data, exists);
    }

    /**
     * Get the api endpoint for the entity @todo declare with generic type that can be made specific in the implementation
     * @param program
     * @returns {string}
     */
    public apiEndpoint(program?:Program):string {
        if (program) {
            return '/programs/' + program.programId;
        }
        return '/programs';
    }

    /**
     * Save with all the nested entities too
     * @param program
     * @returns {IPromise<Program>}
     */
    public save(program:Program):ng.IPromise<Program> {

        return this.saveModel(program)
            .then(() => this.$q.all([
                this.saveRelatedEntities(program),
                //this.runQueuedSaveFunctions(),
            ]))
            .then(() => {
                (<IChangeAwareDecorator>program).resetChanged(); //reset so next save only saves the changed ones
                program.setExists(true);
                return program;
            });

    }

    /**
     * Override getModel so that we can calculate cycle timings before returning the program.
     * @param identifier
     * @param withNested
     * @param endpointOverride
     * @param skipInterceptor
     * @returns {IPromise<Program>}
     */
    public getModel<T extends Program>(identifier:string, withNested:string[] = null, endpointOverride:string = null, skipInterceptor:boolean = false):ng.IPromise<T> {

        return super.getModel<Program>(identifier, withNested, endpointOverride, skipInterceptor)
            .then((program:Program) => {

                program = this.calculateCycleTimings(program);

                return program;
            });

    }

    /**
     * Get the rate plans for a program.
     *
     * @param program
     * @returns {IPromise<cycle>}
     */
    public getRatePlans(program:Program):ng.IPromise<ProgramRatePlan[]> {

        return this.ngRestAdapter
            .get(this.apiEndpoint(program) + '/pricing')
            .then((res) => _.map(res.data, (ratePlanData) => {
                return new ProgramRatePlan(ratePlanData);
            }));

    }

    /**
     * Calculates each cycle's timing in a program (end date and stage)
     * @param program
     * @returns {Program}
     */
    private calculateCycleTimings(program:Program):Program {

        _.forEach(program._cycles, (cycle:Cycle) => {
            cycle.__cycleEndDate = moment(cycle.periodOneStartDate).add(program.periodCount * program.periodLength, 'days');

            let today = moment();

            // Cycle stage could potentially be wrong if the user leaves the program/cycle page open
            // for more than a day.
            if (today.isAfter(cycle.__cycleEndDate.clone().add(cycle.postSeasonDays, 'days'))) {
                cycle.__cycleStage = STAGE_END;
            }
            else if (today.isAfter(cycle.__cycleEndDate)) {
                cycle.__cycleStage = STAGE_POST_SEASON
            }
            else if (today.isAfter(cycle.periodOneStartDate)) {
                cycle.__cycleStage = STAGE_IN_PROGRESS;
            }
            else if (today.isSameOrAfter(cycle.scheduleOnSaleStart)) {
                cycle.__cycleStage = STAGE_PRE_SEASON;
            }
            else {
                cycle.__cycleStage = STAGE_FUTURE;
            }

        });

        return program;

    }

    /**
     * Save all the related entities concurrently
     * @param entity
     * @returns {IPromise<any[]>}
     */
    private saveRelatedEntities(entity:Program):ng.IPromise<any> {

        return this.$q.all([ //save all related entities
            this.saveEntityTags(entity),
            this.saveEntityProgramOptions(entity)
        ]);

    }

    /**
     * Get the guides associated with the program
     */
    public getGuides(program:Program):ng.IPromise<Guide[]> {

        return this.ngRestAdapter
            .get(this.apiEndpoint(program) + '/guides', {
                'With-Nested': 'tags, thumbnailImage'
            })
            .then((res) => _.map(res.data, (guideData) => {
                return new Guide(guideData);
            }));
    }

    /**
     * Get the guide categories associated with the program
     */
    public getGuideTags(program:Program):ng.IPromise<Tag[]> {

        return this.ngRestAdapter
            .get(this.apiEndpoint(program) + '/guides/tags', {
                'With-Nested': 'tags'
            })
            .then((res) => _.map(res.data, (tagData) => {
                return new Tag(tagData);
            }));
    }
}

applyMixins(ProgramService, [TaggableApiService, ProgramOptionalApiService]);

import {namespace as feed} from "./schedule/feed/feedService";
import {namespace as meal} from "./meal/mealService";
import {namespace as cycle} from "./cycle/cycleService";
import {namespace as mealDay} from "./mealDay/mealDayService";
import {namespace as schedule} from "./schedule/scheduleService";
import {namespace as mealPlan} from "./mealPlan/mealPlanService";
import {namespace as mealPeriod} from "./mealPeriod/mealPeriodService";
import {namespace as programPost} from "./programPost/programPostService";
import {namespace as programOption} from "./programOption/programOptionService";
import Guide from "../../models/post/guide/guideModel";

angular.module(namespace, [
        feed,
        meal,
        cycle,
        mealDay,
        schedule,
        mealPlan,
        mealPeriod,
        programPost,
        programOption,
    ])
    .service('programService', ProgramService);





