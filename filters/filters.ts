import * as angular from "angular";
import {namespace as capitalize} from "./capitalize/capitalize";
import {namespace as string} from "./string/string";
import {namespace as moment} from "./moment/moment";

export const namespace = 'common.filters';

angular.module(namespace, [
    capitalize,
    string,
    moment,
]);

