import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import UserMock from "../../models/user/userModel.mock";
import User from "../../models/user/userModel";
import {AuthorInfoDisplayController} from "./authorInfoDisplay";

interface TestScope extends ng.IRootScopeService {
    AuthorInfoDisplayController:AuthorInfoDisplayController;
    testAuthor:User;
}

describe('Author Info Display Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:AuthorInfoDisplayController,
        author = UserMock.entity();

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });

        //only initialise the directive once to speed up the testing
        if (!directiveController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testAuthor = author;

            let element = angular.element(`
                    <author-info-display author="testAuthor">
                    </author-info-display>
                `);

            compiledElement = $compile(element)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).AuthorInfoDisplayController;
        }

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('author-info-display-directive')).to.be.true;

            expect(directiveController.author).to.deep.equal(author);

        });

    });

});

