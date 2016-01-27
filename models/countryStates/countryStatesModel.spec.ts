import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import CountryStatesMock from "./countryStatesModel.mock";
import CountryStates from "./countryStatesModel";

describe('Country States Model', () => {

    let data = _.clone(CountryStatesMock.entity());

    it('should instantiate a new country states model', () => {

        let countryStates = new CountryStates(data);

        expect(countryStates).to.be.instanceOf(CountryStates);
    });

});

