import {expect} from "../../../testBootstrap.spec";
import * as angular from "angular";
import * as _ from "lodash";
import {GroupedTagsController} from "./groupedTags";
import {CategoryTagMock, LinkingTagMock} from "../../models/tag/tagModel.mock";
import TagService from "../../services/tag/tagService";

interface TestScope extends ng.IRootScopeService {
    testNgModel:any;
    testGroupedTagsModel:any;
    GroupedTagsController:GroupedTagsController;
}

describe('Grouped tags directive', () => {

    let $compile:ng.ICompileService,
        $rootScope:ng.IRootScopeService,
        directiveScope:TestScope,
        compiledElement:ng.IAugmentedJQuery,
        directiveController:GroupedTagsController,
        $q:ng.IQService,
        testGroupTagOne = CategoryTagMock.entity({
            _pivot: {
                parentTagId: 'parent-id1'
            }
        }),
        testGroupTagTwo = CategoryTagMock.entity({
            _pivot: {
                parentTagId: 'parent-id2'
            }
        }),
        testGroupOne = LinkingTagMock.collection(4, {
            _pivot: {
                tagGroupId: testGroupTagOne.tagId
            }
        }),
        testGroupTwo = LinkingTagMock.collection(6, {
            _pivot: {
                tagGroupId: testGroupTagTwo.tagId
            }
        }),
        searchResults = CategoryTagMock.collection(3),
        newTag = CategoryTagMock.entity(),
        tagService:TagService
        ;

    beforeEach(() => {

        angular.mock.module('app');

        // Only initialise the directive once to speed up the testing
        if (!directiveController) {

            angular.mock.inject((_$compile_, _$rootScope_, _$q_, _tagService_) => {
                $compile = _$compile_;
                $rootScope = _$rootScope_;
                $q = _$q_;
                tagService = _tagService_;
            });

            directiveScope = <TestScope>$rootScope.$new();

            directiveScope.testNgModel = testGroupOne.concat(testGroupTwo);

            directiveScope.testGroupedTagsModel = [testGroupTagOne, testGroupTagTwo];

            let queryStub = sinon.stub();
            queryStub.withArgs('foobar').returns($q.when(_.cloneDeep(searchResults)));
            queryStub.withArgs('notfound').returns($q.reject());

            (<any>tagService).getPaginator = () => {
                return {
                    setCount: sinon.stub().returns({
                        query: queryStub
                    })
                }
            };

            (<any>tagService).newTag = sinon.stub().returns(newTag);

            compiledElement = $compile(`
                    <grouped-tags
                        ng-model="testNgModel"
                        group-tags="testGroupedTagsModel">
                    </grouped-tags>
                `)(directiveScope);

            $rootScope.$digest();

            directiveController = (<TestScope>compiledElement.isolateScope()).GroupedTagsController;

        }

    });

    it('should initialise the directive', () => {

        expect($(compiledElement).hasClass('grouped-tags')).to.be.true;

        expect(directiveController.groupTags).to.deep.equal([testGroupTagOne, testGroupTagTwo]);

        expect(directiveController.entityTagGroups[0].groupTag).to.deep.equal(testGroupTagOne);
        expect(directiveController.entityTagGroups[0].tags).to.deep.equal(testGroupOne);

    });

    it('should be able to auto-complete search for tags (results)', (done) => {

        let resultsPromise = directiveController.searchTags('foobar', testGroupTagOne);

        expect(resultsPromise).eventually.to.be.fulfilled;

        resultsPromise.then((results) => {
            let expectedResults = _.cloneDeep(searchResults);
            expectedResults.push(newTag);

            expect(results).to.deep.equal(expectedResults);
            done();
        });

        $rootScope.$apply();

    });

    it('should be able to auto-complete search for tags (no results)', (done) => {

        let resultsPromise = directiveController.searchTags('notfound', testGroupTagOne);

        expect(resultsPromise).eventually.to.be.fulfilled;

        resultsPromise.then((results) => {
            expect(results).to.deep.equal([newTag]);
            done();
        });

        $rootScope.$apply();

    });

    it('should be able to update the tag list if the model changes externally', () => {

        let newGroupOneTags = LinkingTagMock.collection(2, {
            _pivot: {
                tagGroupId: testGroupTagOne.tagId,
                tagGroupParentId: testGroupTagOne._pivot.parentTagId,
            }
        });

        let newGroupTwoTags = LinkingTagMock.collection(3, {
            _pivot: {
                tagGroupId: testGroupTagTwo.tagId,
                tagGroupParentId: testGroupTagTwo._pivot.parentTagId,
            }
        });

        directiveController.handleExternalChange(newGroupOneTags.concat(newGroupTwoTags));

        expect(directiveController.entityTagGroups[0].groupTag).to.deep.equal(testGroupTagOne);
        expect(directiveController.entityTagGroups[0].tags).to.deep.equal(newGroupOneTags);
        expect(directiveController.entityTagGroups[1].groupTag).to.deep.equal(testGroupTagTwo);
        expect(directiveController.entityTagGroups[1].tags).to.deep.equal(newGroupTwoTags);

    });

});

