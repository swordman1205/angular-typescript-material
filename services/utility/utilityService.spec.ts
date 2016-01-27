import {expect} from "../../../testBootstrap.spec";
import UtilityService from "./utilityService";

describe('UtilityService', () => {

    let utilityService:UtilityService;
    let $q:ng.IQService;
    let $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$q_, _utilityService_, _$rootScope_) => {
            utilityService = _utilityService_;
            $q = _$q_;
            $rootScope = _$rootScope_;
        });

    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(utilityService).to.be.an('object');
        });

    });

    describe('Process promises sequentially', () => {

        it('should be able to run a series of promises in sequence', () => {

            let promiseFactories = [
                (value) => $q.when(value + 1),
                (value) => $q.when(value + 2),
                (value) => $q.when(value + 3),
            ];

            let promiseResult = utilityService.serialPromise(promiseFactories, 0);

            $rootScope.$apply();

            expect(promiseResult).eventually.to.equal(6);
        });

        it('should be able to run a series of promises in sequence with extra arguments', () => {

            let promiseFactories = [
                (value, extra) => $q.when(value + 1 + extra),
                (value, extra) => $q.when(value + 2 + extra),
                (value, extra) => $q.when(value + 3 + extra),
            ];

            let promiseResult = utilityService.serialPromise(promiseFactories, 0, null, 2);

            $rootScope.$apply();

            expect(promiseResult).eventually.to.equal(12);
        });

    });

});

