import * as angular from "angular";
import * as _ from "lodash";
import {AbstractModel} from "../../models/abstractModel";
import {Paginator} from "../../services/pagination/paginationService";
import {AbstractApiService} from "../../services/abstractApiService";

export const namespace = 'common.directives.entitySearch';

export interface IEntityChangedHandler {
    (entity:AbstractModel):void;
}

export interface IEntitySearchScope extends ng.IScope {
    modelType:string;
    field:string;
}

export class EntitySearchController {

    static $inject = ['$mdDialog', '$scope', '$injector', '$timeout'];

    public modelType:string;//bound by directive
    public field:string;//bound by directive
    public thumbnail:boolean;//bound by directive

    private entityChangedHandler:IEntityChangedHandler;

    public selectedEntities:AbstractModel[] = [];

    private entitiesPaginator:Paginator;

    private entityService:AbstractApiService;

    constructor(private $mdDialog:ng.material.IDialogService,
                private $scope:ng.IScope,
                private $injector:ng.auto.IInjectorService,
                private $timeout:ng.ITimeoutService) {

        this.entityService = this.$injector.get<AbstractApiService>(this.modelType + 'Service');

        this.entitiesPaginator = this.entityService
            .getPaginator()
            .setCount(10);

        if (this.thumbnail) {
            this.entitiesPaginator.setNested(['thumbnailImage']);
        }

        this.$scope.$watchCollection(() => this.selectedEntities, (newValue, oldValue) => {
            if (!_.isEqual(newValue, oldValue)) {
                this.$timeout(() => {
                    if (!_.isEmpty(this.selectedEntities)) {
                        this.entityChangedHandler(this.selectedEntities[0]);
                    }
                    else {
                        this.entityChangedHandler(null);
                    }
                });
            }
        });
    }

    public registerEntityChangedHandler(handler:IEntityChangedHandler):void {
        this.entityChangedHandler = handler;
    }

    /**
     * Function called by autocomplete search in entity dialog.
     * @param queryString
     * @returns {ng.IPromise<any[]>}
     */
    public entitySearch(queryString:string):ng.IPromise<any> {

        return this.entitiesPaginator.complexQuery({
            [this.field]: [queryString]
        }).catch(() => {
            return [];
        });

    }

}

class EntitySearchDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'entitySearch'];
    public template = require('./entitySearch.tpl.html');
    public replace = true;
    public scope = {
        modelType: '@',
        field: '@',
        thumbnail: '=',
    };

    public controllerAs = 'EntitySearchController';
    public controller = EntitySearchController;
    public bindToController = true;

    constructor() {
    }

    public link = ($scope:IEntitySearchScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:[ng.INgModelController, EntitySearchController]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerEntityChangedHandler((entity:AbstractModel) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            $ngModelController.$setViewValue(entity);
        });

        if ($ngModelController) {

            $ngModelController.$render = () => {

                if ($ngModelController.$modelValue) {
                    directiveController.selectedEntities[0] = $ngModelController.$modelValue;
                } else {
                    directiveController.selectedEntities = [];
                }

            };

        }
    };

    static factory():ng.IDirectiveFactory {
        const directive = () => new EntitySearchDirective();
        return directive;
    }
}

angular.module(namespace, [])
    .directive('entitySearch', EntitySearchDirective.factory());

