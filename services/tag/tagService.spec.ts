import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import {CategoryTagMock, default as TagMock, LinkingTagMock} from "../../models/tag/tagModel.mock";
import {CategoryTag, CategoryTagWithChildren} from "../../models/tag/tagModel";
import ArticleService from "../post/article/articleService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import TagService from "./tagService";
import ArticleMock from "../../models/post/article/articleModel.mock";

describe('Tag Service', () => {

    let tagService:TagService,
        $httpBackend:ng.IHttpBackendService,
        ngRestAdapter:NgRestAdapterService,
        articleService:ArticleService,
        $q:ng.IQService,
        tagCategories:CategoryTag[] = [],
        categoryOneTag = CategoryTagMock.entity({
            tag: 'CategoryOne'
        }),
        categoryTwoTag = CategoryTagMock.entity({
            tag: 'Category Two'
        }),
        categoryThreeTag = CategoryTagMock.entity({
            tag: 'Category Three'
        });

    tagCategories.push(categoryOneTag, categoryTwoTag, categoryThreeTag);

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _tagService_, _ngRestAdapter_, _articleService_, _$q_) => {

            if (!tagService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                tagService = _tagService_;
                ngRestAdapter = _ngRestAdapter_;
                articleService = _articleService_;
                $q = _$q_;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(tagService).to.be.an('object');
        });

    });

    describe('Tag CRUD', () => {

        it('should be able to get a new tag with a UUID', () => {

            let tag = tagService.newTag();

            expect(tag.tagId).to.be.ok;

        });

        it('should be able to save a tag', () => {

            let tag = TagMock.entity();

            $httpBackend.expectPUT('/api/tags/' + tag.tagId, _.clone(tag)).respond(201);

            let savePromise = tagService.saveTag(tag);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(tag);

            $httpBackend.flush();

        });

        it('should be able to get a collection of group tags', () => {

            sinon.spy(ngRestAdapter, 'get');

            let tags = TagMock.collection(3);

            $httpBackend.expectGET('/api/entity/tag-categories').respond(tags);

            let mockApiService = {
                apiEndpoint: sinon.mock().returns('/entity'),
            };

            let groupTags = tagService.getTagCategories(<any>mockApiService);

            expect(groupTags).eventually.to.be.fulfilled;

            expect(groupTags).eventually.to.deep.equal(tags);

            $httpBackend.flush();

            // Should have cached the promise

            let groupTagsCached = tagService.getTagCategories(<any>mockApiService);

            expect(groupTagsCached).eventually.to.be.fulfilled;

            expect(groupTagsCached).eventually.to.deep.equal(tags);

            (<any>ngRestAdapter.get).restore();

        });

    });

    describe('Tag Paginator', () => {

        it('should return the first set of tags', () => {

            sinon.spy(ngRestAdapter, 'get');

            let tags = TagMock.collection(20);

            $httpBackend.expectGET('/api/tags').respond(_.take(tags, 10));

            let tagPaginator = tagService.getPaginator();

            let firstSet = tagPaginator.getNext(10);

            expect(firstSet).eventually.to.be.fulfilled;
            expect(firstSet).eventually.to.deep.equal(_.take(tags, 10));

            $httpBackend.flush();

            (<any>ngRestAdapter.get).restore();

        });

    });

    describe('Utility', () => {

        it('should be able to categorize tags', () => {

            sinon.stub(tagService, 'getTagCategories').returns($q.when(tagCategories));

            let article = ArticleMock.entity(),
                tagOne = LinkingTagMock.entity({
                    _pivot: {
                        tagGroupId: categoryOneTag.tagId
                    }
                }),
                tagTwo = LinkingTagMock.entity({
                    _pivot: {
                        tagGroupId: categoryThreeTag.tagId
                    }
                }),
                tagThree = LinkingTagMock.entity({
                    _pivot: {
                        tagGroupId: categoryThreeTag.tagId
                    }
                }),
                tagFour = LinkingTagMock.entity({
                    _pivot: {
                        tagGroupId: categoryThreeTag.tagId
                    }
                });

            article._tags.push(tagOne, tagTwo, tagThree, tagFour);

            let categorizedTagsPromise = tagService.categorizeTags(article, articleService);

            let categoryOneWithChildren:CategoryTagWithChildren = (<CategoryTagWithChildren>categoryOneTag);
            categoryOneWithChildren._tagsInCategory = [tagOne];

            let categoryTwoWithChildren:CategoryTagWithChildren = (<CategoryTagWithChildren>categoryTwoTag);
            categoryTwoWithChildren._tagsInCategory = [];

            let categoryThreeWithChildren:CategoryTagWithChildren = (<CategoryTagWithChildren>categoryThreeTag);
            categoryThreeWithChildren._tagsInCategory = [tagTwo, tagThree, tagFour];

            expect(categorizedTagsPromise).eventually.to.deep.equal({
                CategoryOne: categoryOneWithChildren,
                CategoryTwo: categoryTwoWithChildren,
                CategoryThree: categoryThreeWithChildren
            });

            (<Sinon.SinonStub>tagService.getTagCategories).restore();

        });

    });

});

