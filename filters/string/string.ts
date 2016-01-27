import * as angular from "angular";
import * as _ from "lodash";

export const namespace = 'common.filters.stringFilters';

export interface IFromCamelFilter {
    (variableString:string):string;
}

export function FromCamelFilterFactory():IFromCamelFilter {

    return function fromCamel(variableString:string):string {
        return _.startCase(_.words(variableString).join(' '));
    }
}

export interface ITruncateFilter {
    (string:string, maxChars?:number, doTruncate?:boolean):string;
}

export function TruncateFilterFactory():ITruncateFilter {

    return function truncate(string:string, maxChars:number = 50, doTruncate:boolean = true):string {
        if (!doTruncate) {
            return string;
        }
        return _.truncate(string, {
            length: maxChars,
            separator: /,? +/,
            omission: `&hellip;`
        });
    }
}

angular.module(namespace, [])
    .filter('fromCamel', FromCamelFilterFactory)
    .filter('truncate', TruncateFilterFactory)
;

