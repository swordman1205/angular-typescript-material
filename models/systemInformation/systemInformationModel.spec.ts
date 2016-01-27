import {expect} from "../../../testBootstrap.spec";
import SystemInformationMock from "./systemInformationModel.mock";
import SystemInformation from "./systemInformationModel";
describe('SystemInformation Model', () => {

    let systemInfoData = SystemInformationMock.entity();

    it('should instantiate a new system information instance', () => {

        let systemInfo = new SystemInformation(systemInfoData);

        expect(systemInfo).to.be.instanceOf(SystemInformation);

    });

});

