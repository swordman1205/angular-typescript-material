import {expect} from "../../../../testBootstrap.spec";
import * as _ from "lodash";
import GuideService from "./guideService";
import CycleMock from "../../../models/cycle/cycleModel.mock";
import GuideMock from "../../../models/post/guide/guideModel.mock";
import ProgramMock from "../../../models/program/programModel.mock";
import Program from "../../../models/program/programModel";
import {LinkingTagMock} from "../../../models/tag/tagModel.mock";

describe('Guide Service', () => {

    let guideService:GuideService,
        $httpBackend:ng.IHttpBackendService,
        $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _guideService_) => {

            if (!guideService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                guideService = _guideService_;
            }

        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            expect(guideService).to.be.an('object');

        });

    });

    describe('Public URL', () => {

        it('guides are not public so this function is implemented but should return empty string', () => {

            let guide = GuideMock.entity();
            let publicUrl = guideService.getPublicUrl(guide);

            expect(publicUrl.length).equals(0);
        });

    });

    describe('Utility', () => {

        it('should be able to add a guide to a cycle', () => {

            let cycle = CycleMock.entity();
            let guide = GuideMock.entity({}, true);

            $httpBackend.expectPUT('/api/cycles/' + cycle.getKey() + '/scheduled-items/guides/' + guide.getKey()).respond(204);

            let promise = guideService.addToCycle(guide, cycle);

            expect(promise).to.eventually.be.fulfilled;

            $httpBackend.flush();

        });

        it('should save a guides related programs', () => {

            let guide = GuideMock.entity();
            guide._programs = ProgramMock.collection(2);

            $httpBackend.expectPUT('/api/guides/' + guide.getKey() + '/programs', _.map(guide._programs, (program:Program) => program.getAttributes(true))).respond(201);

            let savePromise = guideService.save(guide);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(guide);

            $httpBackend.flush();

        });

        it('should be able to filter guides', () => {
            let guides = GuideMock.collection(2);
            let linkTag = LinkingTagMock.entity();
            guides[0]._tags.push(linkTag);
            let result = guideService.filterGuides(guides, linkTag.tag);

            expect(result.length).greaterThan(0);
            expect(result[0]).to.deep.equal(guides[0]);
        });

    });

});

