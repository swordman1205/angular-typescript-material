import * as angular from "angular";
import {namespace as imputSet} from "./set/contentSectionsInputSet";
import {namespace as inputItem} from "./item/contentSectionsInputItem";
import {namespace as sectionInputMedia} from "./types/sectionInputMedia/sectionInputMedia";
import {namespace as sectionInputPromo} from "./types/sectionInputPromo/sectionInputPromo";
import {namespace as sectionInputRichText} from "./types/sectionInputRichText/sectionInputRichText";
import {namespace as sectionInputBlockquote} from "./types/sectionInputBlockquote/sectionInputBlockquote";
import {namespace as sectionInputIngredientsDirections} from "./types/sectionInputIngredientsDirections/sectionInputIngredientsDirections";
import {namespace as sectionInputRecipeInfoBar} from "./types/sectionInputRecipeInfoBar/sectionInputRecipeInfoBar";

export const namespace = 'common.directives.contentSectionsInput';

angular.module(namespace, [
    imputSet,
    inputItem,
    sectionInputMedia,
    sectionInputPromo,
    sectionInputRichText,
    sectionInputBlockquote,
    sectionInputIngredientsDirections,
    sectionInputRecipeInfoBar,
]);

