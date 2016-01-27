import {expect} from "../../../../testBootstrap.spec";
import ProgramPostService from "./programPostService";
import ProgramPostMock from "../../../models/post/programPost/programPostModel.mock";
import CycleMock from "../../../models/cycle/cycleModel.mock";

describe('Program Post Service', () => {

    let programPostService:ProgramPostService,
        $httpBackend:ng.IHttpBackendService,
        $rootScope:ng.IRootScopeService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _programPostService_) => {

            if (!programPostService) { // Don't rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                programPostService = _programPostService_;
            }

        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            expect(programPostService).to.be.an('object');

        });

    });

    describe('Public URL', () => {

        it('should be able to get the public URL of a program post', () => {

            (<any>programPostService).getPublicUrlForEntity = sinon.stub().returns(true);

            let programPost = ProgramPostMock.entity();
            programPost.setExists(true);

            programPostService.getPublicUrl(programPost);

            // @Todo: Complete when program post guest implemented

            //expect((<any>programPostService).getPublicUrlForEntity).to.have.been.calledWith({permalink: article.getIdentifier()}, app.guest.articles.article.ArticleConfig.state)

        });

    });

    describe('Utility', () => {

        it('should be able to create a new program post', () => {

            (<any>programPostService).ngRestAdapter.uuid = sinon.stub().returns('c8b9213d-3af0-4966-8221-d1d2f76e1fff');

            let cycle = CycleMock.entity();
            let programPost = ProgramPostMock.entity({
                programCycleId: cycle.getKey()
            }, false);

            $httpBackend.expectPOST('/api/cycles/' + cycle.getKey() + '/scheduled-items/c8b9213d-3af0-4966-8221-d1d2f76e1fff/program-posts/' + programPost.getKey()).respond(204);

            let promise = programPostService.saveNew(programPost);

            expect(promise).to.eventually.be.fulfilled;

            $httpBackend.flush();

        });

    });

});

