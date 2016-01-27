import {expect} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import CycleScheduleItemMock from "../../../models/cycleScheduleItem/cycleScheduleItemModel.mock";
import momentDate from "../../../libs/moment/momentDate";
import {CopyToDialogController, namespace} from "./copyToDialog";
import ProgramMock from "../../../models/program/programModel.mock";
import CycleMock from "../../../models/cycle/cycleModel.mock";
import ScheduleService, {ISchedule} from "../../../services/program/schedule/scheduleService";
import NotificationService from "../../../services/notification/notificationService";

describe('Scheduled Item Directive - Copy To Controller', () => {

    let CopyToDialogController:CopyToDialogController,
        $rootScope:ng.IRootScopeService,
        scheduleService:ScheduleService,
        $mdDialog:ng.material.IDialogService,
        notificationService:NotificationService,
        $q:ng.IQService;

    // Mocks
    let today = momentDate(),
        scheduledItem = CycleScheduleItemMock.entity(),
        program = ProgramMock.entity({
            periodCount: 5,
            periodLength: 7
        }),
        cycle = CycleMock.entity({
            periodOneStartDate: today.clone(),
            periodInfo: [],
            postSeasonDays: 5,
            scheduleOnSaleStart: today.clone(),
            scheduleOnSalePreSaleDays: 7
        }),
        schedule:ISchedule;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject(($controller, _$rootScope_, _$mdDialog_, _notificationService_, _scheduleService_, _programPostService_, _guideService_, _$q_) => {
            $rootScope = _$rootScope_;
            scheduleService = _scheduleService_;
            $mdDialog = _$mdDialog_;
            notificationService = _notificationService_;
            $q = _$q_;

            schedule = scheduleService.getSchedule(program, cycle);

            CopyToDialogController = $controller(namespace + '.controller', {
                $mdDialog: $mdDialog,
                notificationService: notificationService,
                program: program,
                scheduledItem: scheduledItem,
                scheduleService: scheduleService,
                schedule: schedule,
                cycle: cycle,
                programPostService: _programPostService_,
                guideService: _guideService_
            });
        });

        $mdDialog.cancel = sinon.stub();
        $mdDialog.hide = sinon.stub();

    });

    it('should be able to close the dialog', () => {

        CopyToDialogController.cancelDialog();

        expect($mdDialog.cancel).to.be.called;

    });

    it('should be able to copy the item to another cycle/period', () => {

        scheduleService.copyScheduledItem = sinon.stub().returns($q.when(true));
        notificationService.toast = sinon.stub().returns({pop: sinon.stub()});

        let selectedCycle = CycleMock.entity();

        CopyToDialogController.selectedCycle = selectedCycle;

        CopyToDialogController.copy();

        expect(scheduleService.copyScheduledItem).to.be.calledWith(scheduledItem, selectedCycle);

        expect($mdDialog.hide).to.be.called;

        $rootScope.$apply();

        expect(notificationService.toast).to.be.calledWith('Item copied successfully');

    });

});

