import {expect} from "../../../testBootstrap.spec";
import CycleScheduleItem from "./cycleScheduleItemModel";
import ProgramPostMock from "../post/programPost/programPostModel.mock";
import ProgramPost from "../post/programPost/programPostModel";
import MealPlanMock from "../mealPlan/mealPlanModel.mock";
import MealPlan from "../mealPlan/mealPlanModel";
import GuideMock from "../post/guide/guideModel.mock";
import Guide from "../post/guide/guideModel";
import CycleScheduleItemMock from "./cycleScheduleItemModel.mock";
import {LinkingTag} from "../tag/tagModel";
import TagMock from "../tag/tagModel.mock";
import {namespace as postNamespace} from "../../../app/program/programItem/post/post";

describe('Schedule Item Model', () => {

    it('should instantiate a new schedule item', () => {

        let scheduleItem = new CycleScheduleItem({});

        expect(scheduleItem).to.be.instanceOf(CycleScheduleItem);
    });

    it('should hydrate the scheduled item of type ProgramPost', () => {

        let testItem = new CycleScheduleItem({
            _scheduledItem: ProgramPostMock.entity().getAttributes(),
            scheduledItemType: CycleScheduleItem.programPostType,
        });

        expect(testItem._scheduledItem).to.be.an.instanceOf(ProgramPost);
    });

    it('should hydrate the scheduled item of type MealPlan', () => {

        let testItem = new CycleScheduleItem({
            _scheduledItem: MealPlanMock.entity().getAttributes(),
            scheduledItemType: CycleScheduleItem.mealPlanType,
        });

        expect(testItem._scheduledItem).to.be.an.instanceOf(MealPlan);
    });

    it('should hydrate the scheduled item of type Guide', () => {

        let testItem = new CycleScheduleItem({
            _scheduledItem: GuideMock.entity().getAttributes(),
            scheduledItemType: CycleScheduleItem.guideType,
        });

        expect(testItem._scheduledItem).to.be.an.instanceOf(Guide);
    });

    it('should hydrate meta with extracted category from tag', () => {

        let tagName = "Foobar";

        let scheduleItem = CycleScheduleItemMock.entity({
            feedFormat: 'headlineText',
        });

        scheduleItem._scheduledItem._categoryTag = <LinkingTag>TagMock.entity({
            tag: tagName,
        });

        scheduleItem.hydrateMeta();

        expect(scheduleItem.__meta.heading).to.equal(tagName);
    });

    it('should hydrate meta with default category when there is no tag', () => {

        let scheduleItem = CycleScheduleItemMock.entity({
            feedFormat: 'headlineText',
            scheduledItemType: 'Guide',
        });

        scheduleItem.hydrateMeta();

        expect(scheduleItem.__meta.heading).to.be.a('string');
        expect(scheduleItem.__meta.heading).to.contain('Guide');
    });

    it('should hydrate a meta function, which when injected with a stateService instance, can navigate to a state', () => {

        let testItem = new CycleScheduleItem({
            feedFormat: 'headlineText',
            _scheduledItem: ProgramPostMock.entity().getAttributes(),
            scheduledItemType: CycleScheduleItem.programPostType,
        });

        testItem.hydrateMeta();

        let navigator = testItem.__meta.navigator;

        expect(navigator).to.be.instanceOf(Function);

        let goStub = sinon.stub().returns('mockResult');

        let mockStateService = {
            go: goStub,
        };

        let result = (<any>navigator)(mockStateService);

        expect(result).to.equal('mockResult');
        expect(goStub).to.have.been.calledWith(postNamespace, {permalink: testItem._scheduledItem.permalink}, null);
    });

});

