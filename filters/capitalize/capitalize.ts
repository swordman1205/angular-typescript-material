import * as angular from "angular";

export const namespace = 'common.filters.capitalize';

export interface ICapitalizeFilter {
    (test:string):string;
}

export function CapitalizeFilterFactory():ICapitalizeFilter {

    return function capitalize(text:string) {

        return (!!text) ? text.charAt(0).toUpperCase() + text.substr(1) : '';

    }
}

angular.module(namespace, [])
    .filter('capitalize', CapitalizeFilterFactory)
;

