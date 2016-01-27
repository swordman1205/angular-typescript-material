import * as angular from "angular";
import * as _ from "lodash";
import {ISpiraState} from "../../interfaces.ts";

export const namespace = 'common.providers.stateHelperServiceProvider';

export class StateHelperServiceProvider implements ng.IServiceProvider {

    private states = [];

    constructor() {
    }

    public getStates = function () {
        return this.states;
    };

    public addState = function (name, options) {
        this.states.unshift({
            name: name,
            options: options
        });
    };

    public $get = ['$state', function StateHelperServiceFactory($state) {
        return new StateHelperService($state);
    }];

}

export class StateHelperService {

    constructor(private $state:ng.ui.IStateService) {
    }

    /**
     * Get the direct decendents of a state name. Optionally recurse descendants
     * @param stateName
     * @returns {*}
     * @param recurseLevel
     */
    public getChildStates = (stateName:string, recurseLevel:number = 0):ISpiraState[] => {

        // this regex is going to filter only direct children of this route.
        let childRouteRegex = new RegExp(stateName + "\.[a-z]+$", "i");

        let childStates = _.filter(<ISpiraState[]>this.$state.get(), (state) => {
            return childRouteRegex.test(state.name);
        });

        if (!recurseLevel) {
            return childStates;
        }

        recurseLevel--; //decrement the recursion

        return _.map(childStates, (state:ISpiraState):ISpiraState => {
            state.children = this.getChildStates(state.name, recurseLevel); //recursively find the next child level
            return state;
        });

    };

    public doesInclude(stateOrName:string):boolean {
        return this.$state.includes(stateOrName);
    }
}

angular.module(namespace, [])
    .provider('stateHelperService', StateHelperServiceProvider)
;

