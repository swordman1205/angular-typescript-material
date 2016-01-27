import {expect} from "../../../../testBootstrap.spec";
import * as _ from "lodash";
import ProgramOptionService from "./programOptionService";
import ProgramOptionMock from "../../../models/programOption/programOptionModel.mock";
import ProgramOptionTypeMock from "../../../models/programOptionType/programOptionTypeModel.mock";
import Cycle from "../../../models/cycle/cycleModel";
import MealPlanMock from "../../../models/mealPlan/mealPlanModel.mock";
import {IProgramOptionType} from "./programOptionService";
import {ProgramOptionException} from "./programOptionService";
import CycleMock from "../../../models/cycle/cycleModel.mock";

describe('Program Option Service', () => {

    let programOptionService:ProgramOptionService,
        $httpBackend:ng.IHttpBackendService,
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _programOptionService_, _$q_) => {

            if (!programOptionService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                programOptionService = _programOptionService_;
                $q = _$q_;
            }

        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(programOptionService).to.be.an('object');
        });

    });

    describe('Utility', () => {

        it('should be able to get all program options', () => {

            $httpBackend.expectGET('/api/program-options', (headers:Object) => {
                return headers['With-Nested'] == 'programOptionType';
            }).respond(ProgramOptionMock.collection(4));

            let savePromise = programOptionService.getAll();

            expect(savePromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

        describe('Options Types Array', () => {

            let optionTypes = ProgramOptionTypeMock.collection(2);

            let programOptions = ProgramOptionMock.collection(2, {
                _programOptionType: optionTypes[0]
            }).concat(ProgramOptionMock.collection(2, {
                _programOptionType: optionTypes[1]
            }));

            let extraOption = ProgramOptionMock.entity({
                _programOptionType: optionTypes[0]
            });

            let selectedOptions = [programOptions[0], programOptions[2], extraOption];

            it('should be able to create an option types array for filter', () => {

                let programOptionTypes = programOptionService.initializeProgramOptions(programOptions);

                for (let i = 0; i < 2; i++) {

                    expect(programOptionTypes[i].type.programOptionTypeId).to.equal(optionTypes[i].programOptionTypeId);

                    for (let n = 0; n < 2; n++) {

                        expect(programOptionTypes[i].programOptions[n].selected).to.be.true;

                        expect(programOptionTypes[i].programOptions[n].programOption.programOptionId).to.equal(programOptions[(i * 2) + n].programOptionId);

                    }

                }

            });

            it('should be able to create an option types array from a set of selected options (strict subset)', () => {

                let programOptionTypes = programOptionService.initializeProgramOptions(programOptions, selectedOptions);

                for (let i = 0; i < 2; i++) {

                    expect(programOptionTypes[i].type.programOptionTypeId).to.equal(optionTypes[i].programOptionTypeId);

                    for (let n = 0; n < 2; n++) {

                        if (n == 0) {
                            expect(programOptionTypes[i].programOptions[n].selected).to.be.true;
                        } else {
                            expect(programOptionTypes[i].programOptions[n].selected).to.be.false;
                        }

                        expect(programOptionTypes[i].programOptions[n].programOption.programOptionId).to.equal(programOptions[(i * 2) + n].programOptionId);

                    }

                }

                expect(
                    _.some(programOptionTypes[0].programOptions,
                        {
                            programOption: {programOptionId: extraOption.programOptionId}
                        }
                    )
                ).to.be.false;

            });

            it('should be able to create an option types array from a set of selected options (not strict subset)', () => {

                let programOptionTypes = programOptionService.initializeProgramOptions(programOptions, selectedOptions, true, false);

                expect(
                    _.some(programOptionTypes[0].programOptions,
                        {
                            programOption: {programOptionId: extraOption.programOptionId}
                        }
                    )
                ).to.be.true;

            });

        });

        describe('Determining Meal Plan Selection', () => {

            let selectedOptionTypeOne = ProgramOptionTypeMock.entity(),
                selectedOptionTypeTwo = ProgramOptionTypeMock.entity(),
                selectedOptionOne = ProgramOptionMock.entity({
                    programOptionTypeId: selectedOptionTypeOne.programOptionTypeId
                }),
                selectedOptionTwo = ProgramOptionMock.entity({
                    programOptionTypeId: selectedOptionTypeOne.programOptionTypeId
                }),
                selectedMealPlan = MealPlanMock.entity({
                    _options: [selectedOptionOne, selectedOptionTwo]
                });

            var selectedCycle:Cycle = CycleMock.entity();
            selectedCycle._mealPlans = [
                MealPlanMock.entity({
                    _options: [selectedOptionOne, ProgramOptionMock.entity()]
                }),
                MealPlanMock.entity({
                    _options: [selectedOptionTwo, ProgramOptionMock.entity()]
                }),
                selectedMealPlan
            ];

            var sortedCycleProgramOptions = <IProgramOptionType[]>[
                {
                    type: selectedOptionTypeOne,
                    programOptions: [{
                        programOption: selectedOptionOne,
                        selected: false
                    }],
                    selected: selectedOptionOne
                },
                {
                    type: selectedOptionTypeTwo,
                    programOptions: [{
                        programOption: selectedOptionTwo,
                        selected: false
                    }],
                    selected: selectedOptionTwo
                }
            ];

            it('should be able to determine which meal plan has been selected', () => {

                expect(programOptionService.determineSelectedMealPlanInSelectedCycle(sortedCycleProgramOptions, selectedCycle)).to.equal(selectedMealPlan);

            });

            it('should throw an exception if the selected meal plan can\'t be determined', () => {

                selectedCycle._mealPlans = [
                    angular.copy(selectedMealPlan),
                    selectedMealPlan
                ];

                let altSortedCycleProgramOptions = <IProgramOptionType[]>[
                    {
                        type: selectedOptionTypeOne,
                        programOptions: [{
                            programOption: selectedOptionOne,
                            selected: false
                        }],
                        selected: selectedOptionOne
                    },
                    {
                        type: selectedOptionTypeTwo,
                        programOptions: [{
                            programOption: selectedOptionTwo,
                            selected: false
                        }],
                        selected: selectedOptionTwo
                    }
                ];

                let errorFunction = () => {
                    programOptionService.determineSelectedMealPlanInSelectedCycle(altSortedCycleProgramOptions, selectedCycle);
                };

                expect(errorFunction).to.throw(ProgramOptionException);

            });

        });

    });

});

