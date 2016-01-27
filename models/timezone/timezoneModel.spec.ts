import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import TimezoneMock from "./timezoneModel.mock";
import Timezone from "./timezoneModel";

describe('Timezone Model', () => {

    let data = _.clone(TimezoneMock.entity());

    it('should instantiate a new timezone', () => {

        let timezone = new Timezone(data);

        expect(timezone).to.be.instanceOf(Timezone);
    });

});

