import * as angular from "angular";
import Cycle from "../../../models/cycle/cycleModel";
import Program from "../../../models/program/programModel";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import ProgramPostService from "../../../services/program/programPost/programPostService";
import GuideService from "../../../services/post/guide/guideService";
import {ISchedule, default as ScheduleService} from "../../../services/program/schedule/scheduleService";
import NotificationService from "../../../services/notification/notificationService";

export const namespace = 'common.directives.scheduledItem.copyToDialog';

export class CopyToDialogController {

    public selectedCycle:Cycle;

    static $inject = ['$mdDialog', 'notificationService', 'program', 'scheduledItem', 'scheduleService', 'schedule', 'cycle', 'programPostService', 'guideService'];

    constructor(private $mdDialog:ng.material.IDialogService,
                private notificationService:NotificationService,
                public program:Program,
                private scheduledItem:CycleScheduleItem,
                private scheduleService:ScheduleService,
                private schedule:ISchedule,
                private cycle:Cycle,
                private programPostService:ProgramPostService,
                private guideService:GuideService) {
    }

    /**
     * Close this dialog.
     */
    public cancelDialog() {

        this.$mdDialog.cancel();

    }

    /**
     * Copy item to another cycle/period.
     */
    public copy() {

        this.scheduleService.copyScheduledItem(this.scheduledItem, this.selectedCycle)
            .then(() => {
                this.notificationService.toast('Item copied successfully').pop();
            });

        this.$mdDialog.hide();

    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', CopyToDialogController);

