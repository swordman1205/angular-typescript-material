import * as angular from "angular";
import Article from "../../models/post/article/articleModel";
import User from "../../models/user/userModel";

export const namespace = 'common.directives.authorInfoDisplay';

export class AuthorInfoDisplayController {

    static $inject = [];

    public author:User;
    public recentArticles:Article;

    constructor() {
    }

}

class AuthorInfoDisplayDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['AuthorInfoDisplayController'];
    public template = require('./authorInfoDisplay.tpl.html');
    public replace = true;
    public scope = {
        author: '='
    };

    public controllerAs = 'AuthorInfoDisplayController';
    public controller = AuthorInfoDisplayController;
    public bindToController = true;

    static factory():ng.IDirectiveFactory {
        return () => new AuthorInfoDisplayDirective();
    }
}

angular.module(namespace, [])
    .directive('authorInfoDisplay', AuthorInfoDisplayDirective.factory())
;

