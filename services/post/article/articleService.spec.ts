import {expect} from "../../../../testBootstrap.spec";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import ArticleService from "./articleService";
import ArticleMock from "../../../models/post/article/articleModel.mock";
import SectionMock from "../../../models/section/sectionModel.mock";
import UserMock from "../../../models/user/userModel.mock";
import CommentMock from "../../../models/comment/commentModel.mock";
import Section from "../../../models/section/sectionModel";
import MetaMock from "../../../models/meta/metaModel.mock";
import Meta from "../../../models/meta/metaModel";
import {LinkingTagMock} from "../../../models/tag/tagModel.mock";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import LocalizationMock from "../../../models/localization/localizationModel.mock";
import RichText from "../../../models/section/sections/richTextModel";

describe('Article Service', () => {

    let articleService:ArticleService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $rootScope:ng.IRootScopeService;
    let $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _articleService_, _ngRestAdapter_, _$rootScope_, _$q_) => {

            if (!articleService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                articleService = _articleService_;
                ngRestAdapter = _ngRestAdapter_;
                $rootScope = _$rootScope_;
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

            return expect(articleService).to.be.an('object');
        });

    });

    describe('Retrieve an article paginator', () => {

        beforeEach(() => {

            sinon.spy(ngRestAdapter, 'get');

        });

        afterEach(() => {

            (<any>ngRestAdapter.get).restore();

        });

        let articles = ArticleMock.collection(30); //get a set of articles

        it('should return the first set of articles', () => {

            $httpBackend.expectGET('/api/articles').respond(_.take(articles, 10));

            let articlePaginator = articleService.getPaginator();

            let firstSet = articlePaginator.getNext(10);

            expect(firstSet).eventually.to.be.fulfilled;
            expect(firstSet).eventually.to.deep.equal(_.take(articles, 10));

            $httpBackend.flush();

        });

    });

    describe('Get article', () => {

        let mockArticle = ArticleMock.entity();

        it('should be able to retrieve an article by permalink', () => {

            $httpBackend.expectGET('/api/articles/' + mockArticle.permalink, (headers) => {
                return headers['With-Nested'] == 'permalinks, metas, tags, author'
            }).respond(mockArticle);

            let article = articleService.getModel(mockArticle.permalink, ['permalinks', 'metas', 'tags', 'author']);

            expect(article).eventually.to.be.fulfilled;
            expect(article).eventually.to.deep.equal(mockArticle);

            $httpBackend.flush();

        });

        it('should be able to retrieve an article section', () => {

            mockArticle._sections = SectionMock.collection();
            let firstSection = mockArticle._sections[0];

            $httpBackend.expectGET('/api/articles/' + mockArticle.getKey() + '/sections/' + mockArticle._sections[0].getKey())
                .respond(firstSection);

            let sectionPromise = articleService.getSection(mockArticle, firstSection.getKey());

            expect(sectionPromise).eventually.to.be.fulfilled;
            expect(sectionPromise).eventually.to.deep.equal(firstSection);

            $httpBackend.flush();

        });

    });

    describe('New Article', () => {

        it('should be able to get a new article with a UUID', () => {

            let author = UserMock.entity();

            let article = articleService.newEntity(author);

            expect(article.postId).to.be.ok;

            expect(article.authorId).to.equal(author.userId);

            expect(article._author).to.deep.equal(author);

        });

    });

    describe('New Comment', () => {

        it('should be able to save a new comment', () => {

            let article = ArticleMock.entity();

            let comment = CommentMock.entity();
            let user = UserMock.entity();

            comment._author = user;

            $httpBackend.expectPOST('/api/articles/' + article.getKey() + '/comments').respond(201, comment);

            let savePromise = articleService.saveComment(article, user, comment.body);

            expect(savePromise).eventually.to.be.fulfilled;

            savePromise.then((savedComment) => {
                expect(savedComment.body).to.equal(comment.body);
                expect(savedComment._author.getKey()).to.equal(comment._author.getKey());
                expect(savedComment.postCommentId).to.equal(comment.postCommentId);
            });

            $httpBackend.flush();

        });

    });

    describe('Remove Article', () => {

        it('should be able to remove an article', () => {

            let article = ArticleMock.entity();

            $httpBackend.expectDELETE('/api/articles/' + article.postId).respond(201);

            let savePromise = articleService.removeModel(article);

            expect(savePromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

    });

    describe('Save Article', () => {

        it('should save an articles related sections', () => {

            let article = ArticleMock.entity();
            article.setExists(true);
            article._sections = SectionMock.collection(2, {}, false);

            $httpBackend.expectPUT('/api/articles/' + article.postId + '/sections', _.map(article._sections, (section:Section<any>) => section.getAttributes(true))).respond(201);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(article);

            $httpBackend.flush();

        });

        it('should save an articles related metas', () => {

            let article = ArticleMock.entity();
            article.setExists(true);
            article._metas = article._metas.concat(MetaMock.collection(2, {metaableId: article.postId}, false));

            let expectation = _.chain(article._metas)
                .filter((item) => !_.isEmpty(item.metaContent))
                .map((item:Meta) => item.getAttributes())
                .value();

            $httpBackend.expectPUT('/api/articles/' + article.postId + '/meta', expectation).respond(201);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(article);

            $httpBackend.flush();

        });

        it('should save articles related tags', () => {

            let article = ArticleMock.entity();
            article.setExists(true);
            article._tags.push(LinkingTagMock.entity());
            article._tags.push(LinkingTagMock.entity());

            $httpBackend.expectPUT('/api/articles/' + article.postId + '/tags', _.cloneDeep(article._tags)).respond(201);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(article);

            $httpBackend.flush();
        });

        it('should save a new article without related entities', () => {

            let article = ArticleMock.entity();
            article.setExists(false);

            $httpBackend.expectPUT('/api/articles/' + article.postId, article.getAttributes()).respond(201);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(article);

            $httpBackend.flush();

        });

        it('should save an existing article with a patch request', () => {

            let article = ArticleMock.entity();
            article.setExists(true);

            article.title = "This title has been updated";

            article._tags = [LinkingTagMock.entity()];

            $httpBackend.expectPATCH('/api/articles/' + article.postId, (<IChangeAwareDecorator>article).getChanged()).respond(201);
            $httpBackend.expectPUT('/api/articles/' + article.postId + '/tags', _.cloneDeep(article._tags)).respond(201);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.be.fulfilled;
            expect(savePromise).eventually.to.deep.equal(article);

            $httpBackend.flush();

        });

        it('should not make an api call if nothing has changed', () => {

            let article = ArticleMock.entity();
            article.setExists(true);

            let savePromise = articleService.save(article);

            expect(savePromise).eventually.to.equal(article);

        });

        describe('Localization saving', () => {

            it('should save any added localizations for the article', () => {

                let article = ArticleMock.entity();
                article.setExists(true);

                let localizationMock = LocalizationMock.entity({
                    localizations: {
                        title: "Localized title"
                    }
                }, false);

                article._localizations.push(localizationMock);

                $httpBackend.expectPUT('/api/articles/' + article.postId + '/localizations/' + localizationMock.regionCode, localizationMock.localizations).respond(201);

                let savePromise = articleService.save(article);

                expect(savePromise).eventually.to.be.fulfilled;
                expect(savePromise).eventually.to.deep.equal(article);

                $httpBackend.flush();

            });

            it('should save localizations for nested sections', () => {

                let sectionId = 'abc-123';
                let localizationMock = LocalizationMock.entity({
                    localizations: {
                        content: {
                            body: "Localized text"
                        },
                    }
                }, false);

                let sectionMock = SectionMock.entity({
                    sectionId: sectionId,
                    type: RichText.contentType,
                });

                let article = ArticleMock.entity({
                    _sections: [sectionMock]
                }, true);

                article._sections[0]._localizations.push(localizationMock);

                $httpBackend.expectPUT('/api/articles/' + article.postId + '/sections').respond(201);
                $httpBackend.expectPUT('/api/articles/' + article.postId + '/sections/' + sectionId + '/localizations/' + localizationMock.regionCode, localizationMock.localizations).respond(201);

                let savePromise = articleService.save(article);

                expect(savePromise).eventually.to.be.fulfilled;
                expect(savePromise).eventually.to.deep.equal(article);

                $httpBackend.flush();

            });

        });

        describe('queued save functions', () => {

            it('should be able to queue a function (delete section) to be run when save is called', () => {

                let article = ArticleMock.entity({
                    _sections: SectionMock.collection(2, {}, true),
                }, true);

                let queuedSaveFunction = () => {
                    return articleService.deleteSection(article, article._sections[0]);
                };

                articleService.addQueuedSaveProcessFunction(queuedSaveFunction);

                $httpBackend.expectDELETE('/api/articles/' + article.postId + '/sections/' + article._sections[0].sectionId).respond(201);

                let savePromise = articleService.save(article);

                expect(savePromise).eventually.to.equal(article);

                $httpBackend.flush();

            });

            it('should be able to clear the queued save functions', () => {

                let queuedSaveFunction = ():ng.IPromise<boolean> => {
                    return $q.when(true);
                };

                articleService.addQueuedSaveProcessFunction(queuedSaveFunction);

                expect((<any>articleService).queuedSaveProcessFunctions).to.have.length(1);

                articleService.dumpQueueSaveFunctions();

                expect((<any>articleService).queuedSaveProcessFunctions).to.be.empty;
            });

        });

    });

    describe('Public URL', () => {

        it('should be able to get the public URL of an article', () => {

            (<any>articleService).getPublicUrlForEntity = sinon.stub().returns(true);

            let article = ArticleMock.entity();
            article.setExists(true);

            articleService.getPublicUrl(article);

            expect((<any>articleService).getPublicUrlForEntity).to.have.been.calledWith({permalink: article.getIdentifier()}, 'app.guest.articles.article')

        });

    });

    describe('Meta', () => {

        it('should be able to hydrate meta with template', () => {

            let seededChance = new Chance();

            let postId = seededChance.guid();

            let article = ArticleMock.entity({
                postId: postId,
                _metas: [
                    {
                        metaName: 'keyword',
                        metaContent: 'foo',
                        metaId: seededChance.guid(),
                        metaableId: postId
                    },
                    {
                        metaName: 'description',
                        metaContent: 'bar',
                        metaId: seededChance.guid(),
                        metaableId: postId
                    },
                    {
                        metaName: 'foobar',
                        metaContent: 'foobar',
                        metaId: seededChance.guid(),
                        metaableId: postId
                    }
                ]
            });

            article._metas = articleService.hydrateMetaCollection(article);

            // The first article meta is 'name' which is added via template
            expect(article._metas[0].metaableId).to.equal(article.postId);
            expect(_.isEmpty(article._metas[0].metaId)).to.be.false;

            let testableMetaTags = _.map(article._metas, (meta:Meta) => {
                return _.pick(meta, ['metaName', 'metaContent']);
            });

            expect(testableMetaTags).to.deep.equal([
                {
                    metaName: 'name',
                    metaContent: '',
                },
                {
                    metaName: 'description',
                    metaContent: 'bar'
                },
                {
                    metaName: 'keyword',
                    metaContent: 'foo'
                },
                {
                    metaName: 'canonical',
                    metaContent: ''
                },
                {
                    metaName: 'foobar',
                    metaContent: 'foobar'
                }
            ]);

        });

    });

});

