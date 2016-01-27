import {expect} from "../../../testBootstrap.spec";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import SystemInformationService from "./systemInformationService";
import SystemInformationMock from "../../models/systemInformation/systemInformationModel.mock";
import * as _ from "lodash";

describe('SystemInformationService', () => {

    let systemInformationService:SystemInformationService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _systemInformationService_, _ngRestAdapter_, _$rootScope_) => {

            if (!systemInformationService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                systemInformationService = _systemInformationService_;
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

            return expect(systemInformationService).to.be.an('object');
        });

    });

    describe('Retrieve system information', () => {

        let mock = SystemInformationMock.entity();

        it('should get system information files from both app and api', () => {

            $httpBackend.expect('OPTIONS', '/').respond(null, {
                'Spira-App-Version': "%ciBuild.id%",
                'Spira-Loadbalancer-Version': "%ciBuild.id%",
            });
            $httpBackend.expect('OPTIONS', '/api/countries-timezones').respond(null, {
                'Spira-Api-Version': "%ciBuild.id%",
                'Spira-Loadbalancer-Version': "%ciBuild.id%",
            });

            let systemInformationPromise = systemInformationService.getSystemInformation();
            $httpBackend.flush();

            expect(systemInformationPromise).eventually.to.be.fulfilled;
            expect(systemInformationPromise).eventually.to.deep.equal(mock);

            $rootScope.$apply();

        });

    });

});


