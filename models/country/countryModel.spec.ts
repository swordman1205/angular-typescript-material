import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import CountryMock from "./countryModel.mock";
import Country from "./countryModel";

describe('Country Model', () => {

    let data = _.clone(CountryMock.entity());

    it('should instantiate a new country', () => {

        let country = new Country(data);

        expect(country).to.be.instanceOf(Country);
    });

});

