import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";

interface TestScope extends ng.IRootScopeService {
    ngModel:any
}

describe('Double Switch directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
        });

        directiveScope = <TestScope>$rootScope.$new();

        directiveScope.ngModel = "Left";

        compiledElement = $compile(`<double-switch
                                   ng-model="ngModel"
                                   left-label="Left Label"
                                   right-label="Right Label"
                                   left-value="'Left'"
                                   right-value="'Right'"
                                   aria-label="Toggle Media Type"></double-switch>`)(directiveScope);

        $rootScope.$digest();
    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {
            expect($(compiledElement).find('div').hasClass('double-switch')).to.be.true;
        });

        it('should have the proper labels', () => {
            expect($($(compiledElement).find('label')[0]).html()).to.equal("Left Label");
            expect($($(compiledElement).find('label')[1]).html()).to.equal("Right Label");
        });

        it('should have an active class for the left label', () => {
            directiveScope.ngModel = "Left";
            $rootScope.$digest();

            expect($($(compiledElement).find('label')[0]).hasClass('active')).to.be.true;
            expect($($(compiledElement).find('label')[1]).hasClass('active')).to.be.false;
        });

        it('should have an active class for the right label', () => {
            directiveScope.ngModel = "Right";
            $rootScope.$digest();

            expect($($(compiledElement).find('label')[0]).hasClass('active')).to.be.false;
            expect($($(compiledElement).find('label')[1]).hasClass('active')).to.be.true;
        });
    });
});
