import * as angular from "angular";
import * as _ from "lodash";
import ProgramOption from "../../../models/programOption/programOptionModel";
import ProgramOptionType from "../../../models/programOptionType/programOptionTypeModel";
import {AbstractApiService} from "../../abstractApiService";
import MealPlan from "../../../models/mealPlan/mealPlanModel";
import Cycle from "../../../models/cycle/cycleModel";
import SpiraException from "../../../../exceptions";

export const namespace = 'programOption';

export class ProgramOptionException extends SpiraException {
    constructor(public message:string) {
        super(message);
        this.name = 'ProgramOptionException';
    }
}

export interface IProgramOptionSelected {
    programOption:ProgramOption;
    selected:boolean; // Used in admin to select which options appear for a program/cycle
}

export interface IProgramOptionType {
    type:ProgramOptionType;
    programOptions:IProgramOptionSelected[];
    selected:ProgramOption; // Used in guest to select an option for a type group
}

export default class ProgramOptionService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state'];

    /**
     * Get an instance of the ProgramOption given data
     * @param data
     * @returns {ProgramOption}
     * @param exists
     */
    protected modelFactory(data:any, exists:boolean = false):ProgramOption {
        return new ProgramOption(data, exists);
    }

    /**
     * Get the api endpoint for the entity.
     *
     * @returns {string}
     * @param programOption
     */
    public apiEndpoint(programOption?:ProgramOption):string {
        if (programOption) {
            return '/program-options/' + programOption.getKey();
        }
        return '/program-options';
    }

    /**
     * Get all available program options.
     * @returns {IPromise<ProgramOption[]>}
     */
    public getAll():ng.IPromise<ProgramOption[]> {

        return this.ngRestAdapter.get(this.apiEndpoint(), {
                'With-Nested': 'programOptionType'
            })
            .then((res:ng.IHttpPromiseCallbackArg<ProgramOption[]>) => {
                return _.map(res.data, (programOptionData) => {
                    return this.modelFactory(programOptionData, true);
                });
            });
    }

    /**
     * Sort program options by program option type. Determine if an option type is selected.
     *
     * If no 'selectedOptions' is passed through, selected defaults to 'defaultSelected'.
     *
     * When 'strictSubset' is true, any options in 'selectedOptions' which are not present in
     * 'programOptions' are not included in the result.
     *
     * @param programOptions
     * @param selectedOptions
     * @param defaultSelected
     * @param strictSubset
     * @returns {IProgramOptionType[]}
     */
    public initializeProgramOptions(programOptions:ProgramOption[], selectedOptions:ProgramOption[] = [], defaultSelected:boolean = true, strictSubset = true):IProgramOptionType[] {
        // @TODO it appears the defaultSelected param is changing all the options as selected where it should only make one option as selected
        let programOptionTypes:IProgramOptionType[] = [];
        _.forEach(programOptions, (programOption) => {
            this.addToProgramOptionTypes(programOptionTypes, programOption, selectedOptions, defaultSelected);
        });

        if (!strictSubset) {
            // Find all options in 'selectedOptions' not in 'programOptions' and add them to the result
            let leftovers:ProgramOption[] = _.reject(selectedOptions, (option) => {
                return _.some(programOptions, {programOptionId: option.programOptionId});
            });

            _.forEach(leftovers, (leftover) => {
                this.addToProgramOptionTypes(programOptionTypes, leftover, [], true);
            });
        }

        return programOptionTypes;

    }

    private addToProgramOptionTypes(programOptionTypes:IProgramOptionType[], programOption:ProgramOption, selectedOptions:ProgramOption[], defaultSelected:boolean = true):void {
        let existingProgramOptionType = _.find(programOptionTypes, {type: {type: programOption._programOptionType.type}});

        // We have to create a new instance of ProgramOption here to remove the pivot data. The pivot data
        // relates Cycle to the ProgramOption, from this point onwards we are associating ProgramOption with
        // CycleScheduleItem.
        let programOptionSelected:IProgramOptionSelected = {
            programOption: new ProgramOption(programOption.getAttributes()),
            selected: _.isEmpty(selectedOptions) ? defaultSelected : _.some(selectedOptions, {programOptionId: programOption.programOptionId})
        };

        if (existingProgramOptionType) {
            existingProgramOptionType.programOptions.push(programOptionSelected);
        }
        else {
            programOptionTypes.push({
                type: programOption._programOptionType,
                programOptions: [programOptionSelected],
                selected: null
            });
        }
    }

    /**
     * Used in conjunction with initializeProgramOptions
     */
    public determineSelectedMealPlanInSelectedCycle(sortedCycleProgramOptions:IProgramOptionType[], cycle:Cycle):MealPlan {
        
        if (cycle._mealPlans.length == 0 || _.first(cycle._mealPlans)._options.length == 0) {
            throw new ProgramOptionException('Cycle needs to have nested meal plans with options');
        }
        
        let selectedOptionIds:string[] = _.map(sortedCycleProgramOptions, (programOptionType:IProgramOptionType) => {
            return programOptionType.selected.programOptionId;
        });

        let selectedMealPlan:MealPlan[] = _.reject(cycle._mealPlans, (mealPlan:MealPlan) => {
            let reject:boolean = false;

            _.forEach(selectedOptionIds, (selectedOptionId:string) => {
                if (!_.some(mealPlan._options, {programOptionId: selectedOptionId})) {
                    reject = true;
                    return false;
                }
            });

            return reject;
        });

        if (selectedMealPlan.length != 1) {
            throw new ProgramOptionException('Unable to determine selected meal plan from program options');
        }

        return _.head(selectedMealPlan);
    }
}

angular.module(namespace, [])
    .service('programOptionService', ProgramOptionService);





