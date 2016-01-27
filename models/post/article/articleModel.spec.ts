import {expect, seededChance} from "../../../../testBootstrap.spec";
import * as _ from "lodash";
import Article from "./articleModel";
import SectionMock from "../../section/sectionModel.mock";
import ArticleMock from "./articleModel.mock";
import Section from "../../section/sectionModel";
import {IChangeAwareDecorator} from "../../../decorators/changeAware/changeAwareDecorator";
import {STATUS_DRAFT, STATUS_SCHEDULED, STATUS_PUBLISHED} from "../../../mixins/publishableModel";
import Meta from "../../meta/metaModel";
import {momentExtended as moment} from "../../../../common/libs/moment/moment";

describe('Article Model', () => {

    let title = seededChance.sentence(),
        postId = seededChance.guid(),
        articleData = {
            postId: postId,
            title: title,
            permalink: title.toLowerCase().replace(' ', '-'),
            content: seededChance.paragraph({sentences: 10}),
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
        };

    it('should instantiate a new article', () => {

        let article = new Article(articleData);

        expect(article).to.be.instanceOf(Article);

    });

    it('should get the uuid identifier when there is no permalink', () => {

        let uuid = seededChance.guid();

        let article = new Article({postId: uuid});

        expect(article.getIdentifier()).to.be.equal(uuid);

    });

    it('should get the permalink identifier when there is a permalink', () => {

        let uuid = seededChance.guid();
        let permalink = seededChance.string();

        let article = new Article({postId: uuid, permalink: permalink});

        expect(article.getIdentifier()).to.be.equal(permalink);

    });

    it('should be able to hydrate the article metas', () => {

        let article = new Article(articleData);

        let testableMetaTags = _.map(article._metas, (metaTag) => {
            expect(metaTag).to.be.an.instanceOf(Meta);
            expect(metaTag.metaableId).to.equal(article.postId);
            expect(_.isEmpty(metaTag.metaId)).to.be.false;

            return {
                metaName: metaTag.metaName,
                metaContent: metaTag.metaContent
            };
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

    it('should hydrate nested sections when an new article is created', () => {

        let sections = SectionMock.collection(5);

        let article = ArticleMock.entity({
            _sections: sections
        });

        expect(article._sections).to.have.lengthOf(5);
        expect(article._sections[0]).to.be.instanceOf(Section);

        let expectedType = Section.getContentType(article._sections[0].type);

        expect(article._sections[0].content).to.be.instanceOf(expectedType);

    });

    it('should sort the sections by the article sort order', () => {

        let sections = SectionMock.collection(3);

        let setOrder = [
            sections[1].sectionId,
            sections[0].sectionId,
            sections[2].sectionId,
        ];

        let article = ArticleMock.entity({
            _sections: sections,
            sectionsDisplay: {
                sortOrder: setOrder
            }
        });

        expect(_.map(article._sections, 'sectionId')).to.deep.equal(setOrder);

    });

    it('should update the section sort order when prompted', () => {

        let sections = SectionMock.collection(3);

        let article = ArticleMock.entity({
            _sections: sections,
            sectionsDisplay: {
                sortOrder: _.map(sections, 'sectionId')
            }
        });

        article._sections.pop();

        article.updateSectionsDisplay();

        expect(article._sections).to.have.length(2);
        expect(article.sectionsDisplay.sortOrder).to.have.length(2);
        expect(article.sectionsDisplay.sortOrder).to.deep.equal(_.map(article._sections, 'sectionId'));
        expect((<IChangeAwareDecorator>article).getChanged()).to.haveOwnProperty('sectionsDisplay');

    });

    it('should not update the section display property sort order when there are no sections', () => {

        let article = ArticleMock.entity({
            sectionsDisplay: {
                sortOrder: []
            }
        });

        article.updateSectionsDisplay();

        expect(article._sections).to.be.empty;
        expect(article.sectionsDisplay.sortOrder).to.be.empty;
        expect((<IChangeAwareDecorator>article).getChanged()).to.be.empty;

    });

    it('should be able to get the status of the article', () => {

        let article = ArticleMock.entity({
            draft: true,
            published: moment().add(1, 'd')
        });

        expect(article.getStatus()).to.equal(STATUS_DRAFT);

        article.draft = false;

        expect(article.getStatus()).to.equal(STATUS_SCHEDULED);

        article.published = moment().subtract(1, 'd');

        expect(article.getStatus()).to.equal(STATUS_PUBLISHED);

    });

});

