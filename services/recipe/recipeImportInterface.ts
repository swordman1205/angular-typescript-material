export interface IIngredientImport {
    name:string;
    quantity:number;
    unit:string;
}

export interface IAccess {
    type:string;
    permission:string;
}

export interface IDirectionImport {
    content:string;
}

export interface ITaxonomy {
    name:string;
    slug:string;
}

export interface IRecipeImport {
    status:string;
    wpId:number;
    title:string;
    permalink:string;
    imageUrl:string;
    photographerAttribution:string;
    contributor:{
        url:string;
        contributor:string;
        enabled:boolean;
    };
    meta:{
        [key:string]:string|number;
    };
    author:{
        username:string;
        email:string;
        displayName:string;
    };
    prepTime:{
        interpreted:string;
        raw:{
            hours:number;
            minutes:number;
        }
    };
    cookTime:{
        interpreted:string;
        raw:{
            hours:number;
            minutes:number
        }
    };
    servings:{
        interpreted:number;
        raw:string;
    };
    body:string;
    taxonomy:{
        allergies:ITaxonomy[];
        dietary:ITaxonomy[];
        mealType:ITaxonomy[];
        misc:ITaxonomy[];
        occasion:ITaxonomy[];
        region:ITaxonomy[];
    };
    tags:string[];
    created:string;
    ingredients:IIngredientImport[];
    directions:IDirectionImport[];
    access:IAccess[];
    isPublic:boolean;
    _original:{
        recipe:any;
        post:any
    };
}





