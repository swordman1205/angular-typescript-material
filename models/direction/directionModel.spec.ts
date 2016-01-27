import {expect} from "../../../testBootstrap.spec";
import Direction from "./directionModel";
describe('Direction Model', () => {

    it('should instantiate a new direction', () => {

        let direction = new Direction({
            content: 'foobar'
        });

        expect(direction).to.be.instanceOf(Direction);

    });

});

