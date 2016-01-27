import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";

interface TestScope extends ng.IRootScopeService {
    testModel:string;
    testForm:ng.IFormController;
}

describe('Not In Form Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });

    });

    it('should be able to remove the form control from the form', () => {

        directiveScope = <TestScope>$rootScope.$new();

        directiveScope.testModel = 'hello';

        let element = angular.element(`
                <form name="testForm">
                    <input name="testInput"
                           ng-model="testModel">
                    </input>
                    <input name="testInputNotInForm"
                           ng-model="testModel"
                           not-in-form>
                    </input>
                </form>
            `);

        compiledElement = $compile(element)(directiveScope);

        $rootScope.$digest();

        expect(_.isEmpty(directiveScope.testForm['testInput'])).to.be.false;

        expect(_.isEmpty(directiveScope.testForm['testInputNotInForm'])).to.be.true;

    });

});

