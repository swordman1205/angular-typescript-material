import * as angular from "angular";
import * as _ from "lodash";
import {CategoryTag, LinkingTag, default as Tag} from "../../models/tag/tagModel";
import {Paginator} from "../../services/pagination/paginationService";
import TagService from "../../services/tag/tagService";

export const namespace = 'common.directives.groupedTags';

export interface ITagForm extends ng.IFormController {
    tags:ng.INgModelController;
}

export interface IEntityTagGroup {
    groupTag:CategoryTag;
    tags:LinkingTag[];
    form:ITagForm;
}

export interface ITagsChangeHandler {
    (tags:Tag[], valid:boolean):void;
}

export class GroupedTagsController {

    public entityTagGroups:IEntityTagGroup[] = [];
    public groupTags:CategoryTag[];

    private tagsPaginator:Paginator;

    private commitHandler:ITagsChangeHandler;

    static $inject = ['$scope', 'tagService', '$q', '$timeout'];

    constructor(private $scope:ng.IRootScopeService,
                private tagService:TagService,
                private $q:ng.IQService,
                private $timeout:ng.ITimeoutService) {
        this.tagsPaginator = this.tagService.getPaginator().setCount(10);

        this.entityTagGroups = _.map(this.groupTags, (groupTag:CategoryTag):IEntityTagGroup => {
            return {
                groupTag: groupTag,
                tags: [],
                form: null
            };
        });

        // Using $watchCollection because when md-on-append is used the tag is not added to
        // the model (this has to be done manually). ng-change does not currently work with
        // md-chips.
        _.forEach(this.entityTagGroups, (tagGroup:IEntityTagGroup):void => {
            this.$scope.$watchCollection(() => tagGroup.tags, (newValue, oldValue) => {
                if (!_.isEqual(newValue, oldValue)) {

                    // If a tag has been added, add the correct group tag ID to all tags
                    if (newValue.length > oldValue.length) {
                        tagGroup.tags = _.map(tagGroup.tags, (tag) => {
                            tag._pivot = {
                                tagGroupId: tagGroup.groupTag.tagId,
                                tagGroupParentId: tagGroup.groupTag._pivot.parentTagId,
                            };
                            return tag;
                        });
                    }

                    let allTags:LinkingTag[] = [];

                    _.forEach(this.entityTagGroups, (tagGroup:IEntityTagGroup) => {
                        allTags = allTags.concat(tagGroup.tags);
                    });

                    this.handleGroupChange(tagGroup, allTags);

                }
            });
        });
    }

    public registerChangeHandler(handler:ITagsChangeHandler) {

        this.commitHandler = handler;

    }

    private handleGroupChange(tagGroup:IEntityTagGroup, tags:LinkingTag[]):void {

        tagGroup.form.tags.$setTouched();
        tagGroup.form.tags.$setDirty();

        if (tagGroup.groupTag._pivot.required) {
            tagGroup.form.tags.$setValidity('required', tagGroup.tags.length > 0);
        }
        if (tagGroup.groupTag._pivot.linkedTagsLimit) {
            tagGroup.form.tags.$setValidity('limit', tagGroup.tags.length <= tagGroup.groupTag._pivot.linkedTagsLimit);
        }

        let valid = _.every(this.entityTagGroups, (tagGroup:IEntityTagGroup) => {
            return tagGroup.form.$valid;
        });

        this.commitHandler(tags, valid);
    }

    /**
     * Function used in auto-complete to search for tags.
     * @param query
     * @returns {ng.IPromise<any[]>}
     * @param searchContextTag
     */
    public searchTags(query:string, searchContextTag:CategoryTag):ng.IPromise<Tag[]> {

        if (searchContextTag._pivot.linkedTagsMustBeChildren) {
            return this.$q.when(_.filter(searchContextTag._childTags, (tag:CategoryTag):boolean => tag.searchable && _.includes(tag.tag.toLowerCase(), query.toLowerCase())));
        }

        return this.tagsPaginator.query(query)
            .then((results):Tag[] => {
                if (!searchContextTag._pivot.linkedTagsMustExist && !_.find(results, {tag: query})) {
                    results.push(this.tagService.newTag({tag: query}));
                }

                return results;
            })
            .catch(():Tag[] => {
                if (searchContextTag._pivot.linkedTagsMustExist) {
                    return [];
                }
                return [this.tagService.newTag({tag: query})];
            });

    }

    public handleExternalChange(tags:LinkingTag[]) {

        //extract the tags from the updated groups
        _.forEach(this.entityTagGroups, (tagGroup:IEntityTagGroup) => {

            tagGroup.tags = _.filter(tags, (tag:LinkingTag) => {
                return tag._pivot.tagGroupId == tagGroup.groupTag.tagId;
            });
        });

        //wait for the form to digest and register form controllers
        this.$timeout(() => {

            //iterate through the groups and register controls
            _.forEach(this.entityTagGroups, (tagGroup:IEntityTagGroup) => {

                tagGroup.form.$addControl(tagGroup.form.tags);
                if (tagGroup.groupTag._pivot.required) {
                    tagGroup.form.tags.$setValidity('required', tagGroup.tags.length > 0);
                }
                if (tagGroup.groupTag._pivot.linkedTagsLimit) {
                    tagGroup.form.tags.$setValidity('limit', tagGroup.tags.length <= tagGroup.groupTag._pivot.linkedTagsLimit);
                }

            });

        });

    }

}

class GroupedTagsDirective implements ng.IDirective {

    public restrict = 'E';
    public require = ['ngModel', 'groupedTags'];
    public template = require('./groupedTags.tpl.html');
    public replace = true;
    public scope = {
        groupTags: '='
    };

    public controllerAs = 'GroupedTagsController';
    public controller = GroupedTagsController;
    public bindToController = true;

    public link = ($scope:ng.IScope,
                   $element:ng.IAugmentedJQuery,
                   $attrs:ng.IAttributes,
                   $controllers:[
                       ng.INgModelController,
                       GroupedTagsController
                       ]) => {

        let $ngModelController = $controllers[0];
        let directiveController = $controllers[1];

        directiveController.registerChangeHandler((tags:LinkingTag[], valid:boolean) => {
            $ngModelController.$setDirty();
            $ngModelController.$setTouched();
            if (valid) {
                $ngModelController.$setViewValue(tags);
            }

            $ngModelController.$setValidity('groupedtags', valid);
        });

        $ngModelController.$render = () => {

            directiveController.handleExternalChange($ngModelController.$modelValue);

        };

    };

    static factory():ng.IDirectiveFactory {
        return () => new GroupedTagsDirective();
    }
}

angular.module(namespace, [])
    .directive('groupedTags', GroupedTagsDirective.factory())
;

