import * as angular from "angular";

export const namespace = 'common.directives.helpBox';

export class HelpBoxController {

    public display:boolean;

    static $inject = [];

    constructor() {

    }
}

class HelpBoxDirective implements ng.IDirective {

    public restrict = 'E';
    public template = require('./helpBox.tpl.html');
    public replace = false;

    public controllerAs = 'HelpBoxController';
    public controller = HelpBoxController;
    public bindToController = true;

    public scope = {
        display: '='
    };

    static factory():ng.IDirectiveFactory {
        return () => new HelpBoxDirective();
    }
}

angular.module(namespace, [])
    .directive('helpBox', HelpBoxDirective.factory())
;
