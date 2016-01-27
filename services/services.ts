import * as angular from "angular";

export const namespace = 'common.services';

import {namespace as  tag} from "./tag/tagService";
import {namespace as  auth} from "./auth/authService";
import {namespace as  user} from "./user/userService";
import {namespace as  role} from "./role/roleService";
import {namespace as  error} from "./error/errorService";
import {namespace as  image} from "./image/imageService";
import {namespace as  zuora} from "./zuora/zuoraService";
import {namespace as  guide} from "./post/guide/guideService";
import {namespace as  region} from "./region/regionService";
import {namespace as  recipe} from "./recipe/recipeService";
import {namespace as  utility} from "./utility/utilityService";
import {namespace as  program} from "./program/programService";
import {namespace as  article} from "./post/article/articleService";
import {namespace as  section} from "./section/sectionService";
import {namespace as  importer} from "./importer/importerService";
import {namespace as  countries} from "./countries/countriesService";
import {namespace as  pagination} from "./pagination/paginationService";
import {namespace as  ingredient} from "./ingredient/ingredientService";
import {namespace as  shoppingList} from "./shoppingList/shoppingListService";
import {namespace as  notification} from "./notification/notificationService";
import {namespace as  systemInformation} from "./systemInformation/systemInformationService";
import {namespace as  dietaryRestriction} from "./dietaryRestriction/dietaryRestrictionService";

angular.module(namespace, [
    tag,
    auth,
    user,
    role,
    error,
    image,
    zuora,
    guide,
    region,
    recipe,
    utility,
    program,
    article,
    section,
    importer,
    countries,
    pagination,
    ingredient,
    shoppingList,
    notification,
    systemInformation,
    dietaryRestriction,
]);



