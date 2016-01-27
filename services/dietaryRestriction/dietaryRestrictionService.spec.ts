import {expect} from "../../../testBootstrap.spec";
import DietaryRestrictionService from "./dietaryRestrictionService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";

describe('Dietary Restriction Service', () => {

    let dietaryRestriction:DietaryRestrictionService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _ingredientService_, _ngRestAdapter_, _$rootScope_) => {

            if (!dietaryRestriction) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                dietaryRestriction = _ingredientService_;
                ngRestAdapter = _ngRestAdapter_;
                $rootScope = _$rootScope_;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(dietaryRestriction).to.be.an('object');
        });

    });

});

