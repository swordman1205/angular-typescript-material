import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {ProgramOptionsController} from "./programOptions";
import ProgramOption from "../../models/programOption/programOptionModel";
import ProgramOptionTypeMock from "../../models/programOptionType/programOptionTypeModel.mock";
import ProgramOptionMock from "../../models/programOption/programOptionModel.mock";
import ProgramOptionService from "../../services/program/programOption/programOptionService";

interface TestScope extends ng.IRootScopeService {
    testProgramOptions:ProgramOption[];
    testProgramOptionsAll:ProgramOption[];
    ProgramOptionsController:ProgramOptionsController;
}

describe('Program Options Directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        ProgramOptionsController:ProgramOptionsController,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        $q:ng.IQService,
        programOptionService:ProgramOptionService;

    let optionTypes = ProgramOptionTypeMock.collection(2),
        allProgramOptions = ProgramOptionMock.collection(3, {
            _programOptionType: optionTypes[0]
        }).concat(ProgramOptionMock.collection(3, {
            _programOptionType: optionTypes[1]
        })),
        programOptions = _.take(allProgramOptions, 4);

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$compile_, _$rootScope_, _$q_, _programOptionService_) => {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
            $q = _$q_;
            programOptionService = _programOptionService_;
        });

        sinon.spy(programOptionService, 'initializeProgramOptions');

        // Only initialise the directive once to speed up the testing
        if (!ProgramOptionsController) {

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testProgramOptionsAll = allProgramOptions;

            directiveScope.testProgramOptions = programOptions;

            compiledElement = $compile(`
                        <program-options ng-model="testProgramOptions"
                                         all-program-options="testProgramOptionsAll">
                        </program-options>
                    `)(directiveScope);

            $rootScope.$digest();

            ProgramOptionsController = (<TestScope>compiledElement.isolateScope()).ProgramOptionsController;

        }

    });

    afterEach(() => {

        (<any>programOptionService.initializeProgramOptions).restore();

    });

    describe('Initialization', () => {

        it('should initialise the directive', () => {

            expect($(compiledElement).hasClass('program-options-directive')).to.be.true;

            expect(programOptionService.initializeProgramOptions).to.be.called;

            expect(angular.copy(ProgramOptionsController.sortedProgramOptions)).to.deep.equal(programOptionService.initializeProgramOptions(allProgramOptions, programOptions, true, false));

        });

    });

    describe('Functionality', () => {

        it('should be able to remove a program option', () => {

            let option = ProgramOptionsController.sortedProgramOptions[0].programOptions[0];
            let countBefore = ProgramOptionsController.programOptions.length;
            option.selected = false;

            ProgramOptionsController.programOptionSelected(option);

            expect(ProgramOptionsController.programOptions.length).to.equal(countBefore - 1);

            expect(_.some(
                ProgramOptionsController.programOptions,
                {programOptionId: option.programOption.programOptionId}
            )).to.be.false;

        });

        it('should be able to add a program option', () => {

            let option = ProgramOptionsController.sortedProgramOptions[1].programOptions[1];
            let countBefore = ProgramOptionsController.programOptions.length;
            option.selected = true;

            ProgramOptionsController.programOptionSelected(option);

            expect(ProgramOptionsController.programOptions.length).to.equal(countBefore + 1);

            expect(_.some(
                ProgramOptionsController.programOptions,
                {programOptionId: option.programOption.programOptionId}
            )).to.be.true;

        });

    });

});

