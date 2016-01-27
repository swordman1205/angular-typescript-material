import Image from "../../image/imageModel";
import {AbstractModel} from "../../abstractModel";
import {TSectionModelType} from "../sectionModel";
export interface IMediaContent {
    type:string;
}

export interface IImageContent extends IMediaContent {
    _image:Image;
    caption:string;
}

export interface IVideoContent extends IMediaContent {
    videoId:string;
    provider:string;
    caption?:string;
}

export interface IVideoProvider {
    providerKey:string;
    validationRegex:RegExp;
    minIdLength:number;
    maxIdLength:number;
}

export default class Media extends AbstractModel {
    public static contentType:TSectionModelType = 'media';

    public static videoProviderVimeo:string = 'vimeo';
    public static videoProviderYoutube:string = 'youtube';

    public static videoProviders:IVideoProvider[] = [
        {
            providerKey: Media.videoProviderVimeo,
            validationRegex: /^[0-9]{8,10}$/,
            minIdLength: 8,
            maxIdLength: 10
        },
        {
            providerKey: Media.videoProviderYoutube,
            validationRegex: /^[A-Za-z0-9_-]{11}$/,
            minIdLength: 11,
            maxIdLength: 11
        }
    ];

    public static mediaTypeImage:string = 'image';
    public static mediaTypeVideo:string = 'video';
    public static mediaTypes:string[] = [Media.mediaTypeImage, Media.mediaTypeVideo];

    public media:(IImageContent|IVideoContent)[] = [];
    public size:string;
    public alignment:string;

    constructor(data:any, exists:boolean = false) {
        super(data, exists);
        this.hydrate(data, exists);
    }

}

