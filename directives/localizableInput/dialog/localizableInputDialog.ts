import * as angular from "angular";
import * as _ from "lodash";
import Localization from "../../../models/localization/localizationModel";
import {ISupportedRegion, default as RegionService} from "../../../services/region/regionService";
import NotificationService from "../../../services/notification/notificationService";
import {TOAST_COLOUR_RED} from "../../../services/notification/notificationService.ts";

export const namespace = 'common.directives.localizableInput.dialog';

export interface ILocalizationMap {
    [regionCode:string]:string;
}

export class LocalizableInputDialogController {

    static $inject = ['localizations', 'attributeKey', 'inputNodeName', 'originalValue', 'regionService', '$mdDialog', 'notificationService'];

    public selectedIndex:number = 0;
    public localizationMap:ILocalizationMap;

    constructor(public localizations:Localization<any>[],
                public attributeKey:string,
                public inputNodeName:string,
                public originalValue:string,
                public regionService:RegionService,
                private $mdDialog:ng.material.IDialogService,
                private notificationService:NotificationService) {

        this.localizationMap = _.reduce(regionService.supportedRegions, (localizationMap, region:ISupportedRegion) => {
            localizationMap[region.code] = this.getLocalizationValueForRegion(region.code);
            return localizationMap;
        }, {});

    }

    public copyFromOriginal(regionCode:string):void {

        let prevValue = this.localizationMap[regionCode];
        this.localizationMap[regionCode] = this.originalValue;

        let actionName = 'Undo';
        this.notificationService
            .toast('Content Copied')
            .options({parent: '#localizableInputDialog'})
            .action(actionName)
            .pop()
            .then((action:any) => {
                if (actionName == action) {
                    this.localizationMap[regionCode] = prevValue;

                    this.notificationService
                        .toast('Copy Undone', TOAST_COLOUR_RED)
                        .options({parent: '#localizableInputDialog'})
                        .pop();
                }
            });
    }

    private getLocalizationValueForRegion(regionCode:string):string {
        let localization = _.find(this.localizations, {regionCode: regionCode});

        if (!localization) {
            return undefined;
        }

        return _.get<string>(localization.localizations, this.attributeKey);
    }

    public saveLocalizations() {

        let updatedLocalizations = _.reduce(this.localizationMap, (updatedLocalizations:Localization<any>[], translation:string, regionCode:string) => {

            let existing = _.find(this.localizations, {regionCode: regionCode});

            if (existing) {

                if (!translation) {
                    _.set(existing.localizations, this.attributeKey, undefined);
                } else {
                    _.set(existing.localizations, this.attributeKey, translation);
                }
                updatedLocalizations.push(existing);

                return updatedLocalizations;
            }

            if (!translation) {
                return updatedLocalizations;
            }

            let newLocalization = new Localization<any>({
                localizableId: null, //this is set on save as it depends on the parent model
                localizableType: null, //this is determined by the api
                localizations: {},
                regionCode: regionCode,
            });

            _.set(newLocalization.localizations, this.attributeKey, translation);

            updatedLocalizations.push(newLocalization);

            return updatedLocalizations;

        }, []);

        this.$mdDialog.hide(updatedLocalizations);
    }

    /**
     * allow the user to manually close the dialog
     */
    public cancelDialog() {
        this.$mdDialog.cancel('closed');
    }

}

angular.module(namespace, [])
    .controller(namespace + '.controller', LocalizableInputDialogController);


