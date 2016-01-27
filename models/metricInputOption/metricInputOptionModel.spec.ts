import {expect} from "../../../testBootstrap.spec";
import MetricInputOption from "./metricInputOptionModel";
describe('Metric Input Option Model', () => {

    it('should instantiate a new metric input option', () => {

        let metricInputOption = new MetricInputOption({
            group: 'foobar',
            options: ['foo', 'bar']
        });

        expect(metricInputOption).to.be.instanceOf(MetricInputOption);

    });

});

