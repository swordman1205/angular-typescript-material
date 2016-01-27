import {expect} from "../../../testBootstrap.spec";
import ImporterService from "./importerService";
import {NgJwtAuthService} from "angular-jwt-auth";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";

let importerService:ImporterService,
    ngJwtAuthService:NgJwtAuthService,
    $q:ng.IQService,
    ngRestAdapter:NgRestAdapterService,
    $httpBackend:ng.IHttpBackendService;

describe('Importer Service', () => {

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _ngJwtAuthService_, _$q_, _ngRestAdapter_, _importerService_) => {

            if (!importerService) { // Don't rebind, so each test gets the singleton
                importerService = _importerService_;
                $httpBackend = _$httpBackend_;
                ngJwtAuthService = _ngJwtAuthService_;
                $q = _$q_;
                ngRestAdapter = _ngRestAdapter_;
            }

        });

    });

    describe('Data Import', () => {

        it('should be able to import data', () => {

            $httpBackend.expectGET('/api/utility/wordpress-recipe/foo-bar-id').respond({
                foo: 'bar'
            });

            let importPromise = importerService.importData('foo-bar-id');

            $httpBackend.flush();

            expect(importPromise).eventually.to.deep.equal({foo: 'bar'});
        });

    });

});

