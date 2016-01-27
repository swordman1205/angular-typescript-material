import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import StateMock from "./stateModel.mock";
import State from "./stateModel";

describe('State Model', () => {

    let data = _.clone(StateMock.entity());

    it('should instantiate a new state', () => {

        let state = new State(data);

        expect(state).to.be.instanceOf(State);
    });

});

