import * as angular from "angular";

export const namespace = 'common.directives.menuToggle';

interface IMenuToggleScope extends ng.IScope {
    open:boolean;
    toggle():void;
    gotoState(stateName:string, stateParams:any):void;
    navigationState:ng.ui.IState;
    collapsed?:boolean;
    isChildSelected(navigationStateName:string):boolean;
}

class MenuToggleDirective implements ng.IDirective {

    public restrict = 'E';
    public template = require('./menuToggle.tpl.html');
    public replace = true;
    public scope = {
        navigationState: '=',
        collapsed: '=?',
    };

    constructor(private $timeout:ng.ITimeoutService, private $state:ng.ui.IStateService) {
    }

    public link = ($scope:IMenuToggleScope, $element:ng.IAugmentedJQuery, $attrs:ng.IAttributes, $controllers:any) => {

        let list = $element.find('md-list');

        $scope.open = false;

        this.$timeout(() => {
            $scope.open = this.$state.includes($scope.navigationState.name);
        }, 200);

        $scope.toggle = function () {
            $scope.open = !$scope.open;
        };

        let getTargetHeight = (element:ng.IRootElementService) => {
            element.addClass('no-transition');
            element.css('height', '');
            let targetHeight = element.prop('clientHeight');
            element.css('height', 0);
            element.removeClass('no-transition');
            return targetHeight;
        };

        $scope.$watch('open', (open) => {

            let targetHeight = open ? getTargetHeight(list) : 0;

            this.$timeout(function () {
                list.css({height: targetHeight + 'px'});
            }, 0, false);

        });

        $scope.isChildSelected = (navigationStateName:string):boolean => {
            return this.$state.current.name.indexOf(navigationStateName) > -1;
        }

    };

    static factory():ng.IDirectiveFactory {
        const directive = ($timeout:ng.ITimeoutService, $state:ng.ui.IStateService) => new MenuToggleDirective($timeout, $state);
        directive.$inject = ['$timeout', '$state'];
        return directive;
    }
}

angular.module(namespace, [])
    .directive('menuToggle', MenuToggleDirective.factory())
;

