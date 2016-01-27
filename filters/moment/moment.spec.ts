import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import {IFromNowFilter} from "./moment";

describe('Moment filter', function () {
    let $filter:ng.IFilterService;

    beforeEach(function () {
        angular.mock.module('app');

        angular.mock.inject(function (_$filter_) {
            $filter = _$filter_;
        });
    });

    it('should filter a moment object to a friendly date', function () {

        let dt = moment().subtract(10, 'minutes');

        let result = $filter<IFromNowFilter>('fromNow')(dt);

        expect(result).to.equal('10 minutes ago');
    });
});

