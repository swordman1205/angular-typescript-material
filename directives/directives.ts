import * as angular from "angular";
import {namespace as avatar} from "./avatar/avatar";
import {namespace as helpBox} from "./helpBox/helpBox";
import {namespace as sections} from "./sections/sections";
import {namespace as notInForm} from "./notInForm/notInForm";
import {namespace as mediaImage} from "./mediaImage/mediaImage";
import {namespace as videoEmbed} from "./videoEmbed/videoEmbed";
import {namespace as menuToggle} from "./menuToggle/menuToggle";
import {namespace as groupedTags} from "./groupedTags/groupedTags";
import {namespace as doubleSwitch} from "./doubleSwitch/doubleSwitch";
import {namespace as recipeSelect} from "./recipeSelect/recipeSelect";
import {namespace as entitySearch} from "./entitySearch/entitySearch";
import {namespace as mdDatepicker} from "./mdDatepicker/mdDatepicker";
import {namespace as commandWidget} from "./commandWidget/commandWidget";
import {namespace as scheduledItem} from "./scheduledItem/scheduledItem";
import {namespace as paymentMethod} from "./paymentMethod/paymentMethod";
import {namespace as markdownEditor} from "./markdownEditor/markdownEditor";
import {namespace as programOptions} from "./programOptions/programOptions";
import {namespace as ratePlanSelect} from "./ratePlanSelect/ratePlanSelect";
import {namespace as scheduleToolbar} from "./scheduleToolbar/scheduleToolbar";
import {namespace as ratePlanDisplay} from "./ratePlanDisplay/ratePlanDisplay";
import {namespace as localizableInput} from "./localizableInput/localizableInput";
import {namespace as ingredientDisplay} from "./ingredientDisplay/ingredientDisplay";
import {namespace as authorInfoDisplay} from "./authorInfoDisplay/authorInfoDisplay";
import {namespace as userCountrySelect} from "./userCountrySelect/userCountrySelect";
import {namespace as recipeMethodDisplay} from "./recipeMethodDisplay/recipeMethodDisplay";
import {namespace as contentSectionsInput} from "./contentSectionsInput/contentSectionsInput";

/**
 * @todo import less files directly from their associated modules.
 * This method works, but is not idea for module fragmentation
 */
requireAll((<any>require).context("./", true, /.less$/));
function requireAll(r:any):any {
    r.keys().forEach(r);
}

export const namespace = 'common.directives';

angular.module(namespace, [
    avatar,
    helpBox,
    sections,
    notInForm,
    mediaImage,
    videoEmbed,
    menuToggle,
    groupedTags,
    doubleSwitch,
    recipeSelect,
    entitySearch,
    mdDatepicker,
    commandWidget,
    scheduledItem,
    paymentMethod,
    markdownEditor,
    programOptions,
    ratePlanSelect,
    scheduleToolbar,
    ratePlanDisplay,
    localizableInput,
    ingredientDisplay,
    authorInfoDisplay,
    userCountrySelect,
    recipeMethodDisplay,
    contentSectionsInput,
])
;

