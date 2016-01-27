import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {IFromCamelFilter} from "./string";

describe('String filters', function () {
    let $filter:ng.IFilterService;

    beforeEach(function () {
        angular.mock.module('app');

        angular.mock.inject(function (_$filter_) {
            $filter = _$filter_;
        });
    });

    it('should filter camel cased string to human readable', function () {

        let result = $filter<IFromCamelFilter>('fromCamel')("camelCase");

        expect(result).to.equal('Camel Case');
    });
});

