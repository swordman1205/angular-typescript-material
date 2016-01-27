import * as angular from "angular";
import * as _ from "lodash";
import CycleScheduleItem from "../../../models/cycleScheduleItem/cycleScheduleItemModel";
import NotificationService from "../../../services/notification/notificationService";
import {IFeedFormatOption, default as ScheduleService} from "../../../services/program/schedule/scheduleService";

export const namespace = 'common.directives.scheduledItem.feedFormattingDialog';

export class FeedFormattingDialogController {

    public feedFormatOptions:IFeedFormatOption[];

    static $inject = ['$mdDialog', 'scheduledItem', 'scheduleService', 'notificationService'];

    constructor(private $mdDialog:ng.material.IDialogService,
                public scheduledItem:CycleScheduleItem,
                private scheduleService:ScheduleService,
                private notificationService:NotificationService) {

        this.scheduleService.getFeedFormatOptions().then((options:IFeedFormatOption[]) => {
            this.feedFormatOptions = _.filter(options, (option:IFeedFormatOption) => {
                return _.includes(option.appliesTo, this.scheduledItem.scheduledItemType);
            });
        });

    }

    /**
     * Close this dialog.
     */
    public cancelDialog() {

        this.$mdDialog.cancel();

    }

    /**
     * Save changes made to schedule.
     */
    public save() {

        this.scheduleService.save(this.scheduledItem)
            .then(() => {
                this.notificationService.toast('Changes saved successfully').pop();
            });

        this.$mdDialog.hide();

    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', FeedFormattingDialogController);

