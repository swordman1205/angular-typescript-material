import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {ICapitalizeFilter} from "./capitalize";

describe('Capitalize filter', function () {
    let $filter:ng.IFilterService;

    beforeEach(function () {
        angular.mock.module('app');

        angular.mock.inject(function (_$filter_) {
            $filter = _$filter_;
        });
    });

    it('should capitalize correctly', function () {

        expect($filter<ICapitalizeFilter>('capitalize')('hello')).to.equal('Hello');

        expect($filter<ICapitalizeFilter>('capitalize')('hello how are you')).to.equal('Hello how are you');

    });
});

