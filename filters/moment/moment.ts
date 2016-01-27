import * as angular from "angular";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export const namespace = 'common.filters.momentFilters';

export interface IFromNowFilter {
    (date:moment.Moment):string|any;
}

export function FromNowFilterFactory():IFromNowFilter {

    return function fromNow(date:moment.Moment):string|any {
        if (!moment.isMoment(date)) {
            return date;
        }
        return date.fromNow();
    }
}

export interface IMomentFilter {
    (date:moment.Moment, format:string):string|any;
}

export function MomentFilterFactory():IMomentFilter {

    return function momentFilter(date:moment.Moment, format:string):string|any {
        if (!moment.isMoment(date)) {
            return date;
        }
        return date.format(format);
    }
}

export interface IMomentDurationFilter {
    (duration:moment.Duration):string|any;
}
export function MomentDurationFilterFactory():IMomentDurationFilter {

    return function momentDurationFilter(duration:moment.Duration):string|any {
        if (!moment.isDuration(duration)) {
            return duration;
        }

        let hours = duration.hours();
        let minutes = duration.minutes();

        let retPieces:string[] = [];

        if (hours) {
            retPieces.push(hours + 'h');
        }

        if (minutes || !hours) {
            retPieces.push(minutes + 'm');
        }

        return retPieces.join(' ');
    }
}

angular.module(namespace, [])
    .filter('fromNow', FromNowFilterFactory)
    .filter('moment', MomentFilterFactory)
    .filter('momentDuration', MomentDurationFilterFactory)
;

