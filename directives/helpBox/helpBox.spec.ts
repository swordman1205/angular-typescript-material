import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {HelpBoxController} from "./helpBox";

interface TestScope extends ng.IRootScopeService {
    HelpBoxController:HelpBoxController;
    toggle:boolean;
}

describe('Help Box Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:HelpBoxController;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.toggle = false;

            let element = angular.element(`<help-box display="toggle"></help-box>`);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.scope()).HelpBoxController;
        }

    });

    it('should be able to toggle the help box', () => {

        it('should be able to display the help box', () => {
            directiveScope.toggle = !directiveScope.toggle;

            expect(directiveController.display).to.be.true;
            expect($(compiledElement).find('.help-box').hasClass('slide-up')).to.be.true;
        });

        it('should be able to hide the help box', () => {

            directiveScope.toggle = !directiveScope.toggle;

            expect(directiveController.display).to.be.false;
            expect($(compiledElement).find('.help-box').hasClass('slide-down')).to.be.true;
        });
    });
});

