import {expect} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import {FeedFormattingDialogController, namespace} from "./feedFormattingDialog";
import CycleScheduleItemMock from "../../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import ScheduleService, {IFeedFormatOption} from "../../../services/program/schedule/scheduleService";
import NotificationService from "../../../services/notification/notificationService";

describe('Scheduled Item Directive - Feed Formatting Controller', () => {

    let FeedFormattingDialogController:FeedFormattingDialogController,
        $rootScope:ng.IRootScopeService,
        $mdDialog:ng.material.IDialogService,
        scheduleService:ScheduleService,
        notificationService:NotificationService,
        $q:ng.IQService,
        formattingOptions:IFeedFormatOption[] = [
            {
                key: 'mockFormat',
                name: "Mock format",
                appliesTo: [
                    'ProgramPost',
                ],
            },
            {
                key: 'mockFormatIrrelevant',
                name: "Mock irrelevant format",
                appliesTo: [
                    'NotAScheduleType',
                ],
            },
        ];

    // Mocks

    let scheduledItem = CycleScheduleItemMock.entity();
    scheduledItem.scheduledItemType = 'ProgramPost';

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject(($controller, _$rootScope_, _$mdDialog_, _scheduleService_, _notificationService_, _$q_) => {
            $rootScope = _$rootScope_;
            $mdDialog = _$mdDialog_;
            scheduleService = _scheduleService_;
            notificationService = _notificationService_;
            $q = _$q_;

            scheduleService.getFeedFormatOptions = sinon.stub().returns($q.when(formattingOptions));

            FeedFormattingDialogController = $controller(namespace + '.controller', {
                $mdDialog: $mdDialog,
                scheduledItem: scheduledItem,
                scheduleService: scheduleService,
                notificationService: notificationService
            });
        });

    });

    it('should have only the relevant feed format options displayed', () => {

        $rootScope.$apply();

        expect(FeedFormattingDialogController.feedFormatOptions).to.have.length(1);
        expect(FeedFormattingDialogController.feedFormatOptions[0].key).to.equal('mockFormat');

    });

    it('should be able to close the dialog', () => {

        $mdDialog.cancel = sinon.stub();

        FeedFormattingDialogController.cancelDialog();

        expect($mdDialog.cancel).to.be.called;

    });

    it('should be able to save changes', () => {

        scheduleService.save = sinon.stub().returns($q.when(true));

        notificationService.toast = sinon.stub().returns({pop: sinon.stub()});

        $mdDialog.hide = sinon.stub();

        FeedFormattingDialogController.save();

        expect(scheduleService.save).to.be.calledWith(scheduledItem);

        expect($mdDialog.hide).to.be.called;

        $rootScope.$apply();

        expect(notificationService.toast).to.be.calledWith('Changes saved successfully');

    });

});

