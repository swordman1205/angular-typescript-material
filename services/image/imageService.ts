import * as angular from "angular";
import * as _ from "lodash";
import {AbstractApiService} from "../abstractApiService";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import PaginationService from "../pagination/paginationService";
import Image from "../../models/image/imageModel";
import {Config} from "../../../config.ts";
import {momentExtended as moment} from "../../../common/libs/moment/moment";

export const namespace = 'common.services.image';

export interface IImageUploadOptions {
    file?:File;
    imageUrl?:string;
    alt:string;
    title?:string;
    imageId?:string;
}

export interface ICloudinaryUploadRequest {
    file:File|string;
    api_key:string;
    timestamp:number;
    signature:string;
    type:string;
    public_id?:string;
    resource_type?:string;
    _inputOptions?:IImageUploadOptions;
}

export interface ICloudinaryUploadResponse {
    bytes:number;
    created_at:string;
    etag:string;
    format:string;
    height:number;
    original_filename:string;
    public_id:string|number;
    resource_type:string;
    secure_url:string;
    signature:string;
    tags:string[];
    type:string;
    url:string;
    version:number; //unix timestamp
    width:number;
}

export interface ICloudinaryFileUploadConfig extends ng.angularFileUpload.IFileUploadConfigFile {
    file:File;
    fields:ICloudinaryUploadRequest;
    sendFieldsAs:string;
}

export interface ICloudinaryUrlUploadConfig {
    file:string;
    fields:ICloudinaryUploadRequest;
    url:string;
}

export interface IImageNotification {
    event:string;
    message:string;
    progressName?:string;
    progressValue?:any;
}

export interface IImageUploadPromise<T> extends ng.IPromise<T> {

}

export interface IImageDeferred<T> extends ng.IDeferred<T> {
    notify(state:IImageNotification):void;
    promise:IImageUploadPromise<T>;
}

export default class ImageService extends AbstractApiService {

    static $inject:string[] = ['ngRestAdapter', 'paginationService', '$q', '$location', '$state', '$http', 'Upload', '$timeout'];

    constructor(ngRestAdapter:NgRestAdapterService,
                paginationService:PaginationService,
                $q:ng.IQService,
                $location:ng.ILocationProvider,
                $state:ng.ui.IStateService,
                private $http:ng.IHttpService,
                private ngFileUpload:ng.angularFileUpload.IUploadService,
                private $timeout:ng.ITimeoutService) {

        super(ngRestAdapter, paginationService, $q, $location, $state);

    }

    /**
     * Get an instance of the Image given data
     * @param data
     * @param exists
     * @returns {Image}
     */
    protected modelFactory(data:any, exists:boolean = false):Image {
        return new Image(data, exists);
    }

    /**
     * Get the api endpoint for the model
     * @returns {string}
     */
    public apiEndpoint(entity?:any):string {
        if (entity) {
            return '/images/' + entity.imageId;
        }
        return '/images';
    }

    /**
     *
     * @returns {IUploadPromise<T>}
     * @param imageUploadOptions
     */
    public uploadImage(imageUploadOptions:IImageUploadOptions):IImageUploadPromise<Image> {

        let cloudinaryOptions = this.getCloudinaryUploadConfig(imageUploadOptions);

        let deferredUploadProgress:IImageDeferred<Image> = this.$q.defer();

        this.signCloudinaryUpload(cloudinaryOptions, deferredUploadProgress)
            .then((signedCloudinaryOptions:ICloudinaryUploadRequest) => this.uploadToCloudinary(signedCloudinaryOptions, deferredUploadProgress))
            .then((cloudinaryResponse:ng.IHttpPromiseCallbackArg<ICloudinaryUploadResponse>) => this.linkImageToApi(cloudinaryOptions, cloudinaryResponse, deferredUploadProgress))
            .then((image:Image) => {
                deferredUploadProgress.resolve(image);
            });

        return deferredUploadProgress.promise;
    }

    /**
     * Send the image config to cloudinary, and register it with the api
     * @param signedCloudinaryOptions
     * @returns {IUploadPromise<any>}
     * @param deferredUploadProgress
     */
    private uploadToCloudinary(signedCloudinaryOptions:ICloudinaryUploadRequest, deferredUploadProgress:IImageDeferred<Image>):ng.angularFileUpload.IUploadPromise<ng.IHttpPromiseCallbackArg<ICloudinaryUploadResponse>> {

        let restoreAuthFunction = this.unsetAuthorizationHeader();

        let uploadPromise;

        if (!_.isString(signedCloudinaryOptions.file)) {

            let uploadOptions = this.getFileUploadConfig(signedCloudinaryOptions);

            uploadPromise = this.ngFileUpload.upload(uploadOptions)
                .progress(function (evt:any) {
                    let progressPercentage = _.round(100.0 * evt.loaded / evt.total);

                    deferredUploadProgress.notify({
                        event: 'cloudinary_upload',
                        message: "Uploading to cloudinary",
                        progressName: 'Upload progress',
                        progressValue: progressPercentage,
                    });

                });
        } else {
            let uploadOptions = this.getUrlUploadConfig(signedCloudinaryOptions);
            uploadPromise = this.ngRestAdapter.api(uploadOptions.url).post('', uploadOptions.fields);
        }

        uploadPromise.finally(() => {
            restoreAuthFunction();
        });

        return uploadPromise;
    }

    /**
     *
     * @returns {function(): undefined}
     */
    private unsetAuthorizationHeader():() => void {

        let currentAuthHeader = this.$http.defaults.headers.common.Authorization;

        delete this.$http.defaults.headers.common.Authorization;

        //return restore function
        return () => {
            this.$http.defaults.headers.common.Authorization = currentAuthHeader;
        };

    }

    /**
     * Get the upload configuration defaults for the cloudinary cdn
     * @returns {{url: string}}
     */
    private getCloudinaryUploadConfig(inputOptions:IImageUploadOptions):ICloudinaryUploadRequest {

        let file;
        if (!!inputOptions.file) {
            file = inputOptions.file;
        } else if (!inputOptions.file && !!inputOptions.imageUrl) {
            file = inputOptions.imageUrl;
        }

        return {
            file: file,
            api_key: undefined,
            signature: undefined,
            timestamp: moment().unix(),
            public_id: inputOptions.imageId || this.ngRestAdapter.uuid(),
            resource_type: 'image', // 'image', 'raw', 'auto'
            type: 'upload', //'upload', 'private', 'authenticated'.
            _inputOptions: inputOptions, //include the raw object for other consumers
        };

    }

    /**
     * Get the configuration object for the angular-file-upload service
     * @param cloudinaryOptions
     * @returns {{file: File, url: string, method: string, fields: Omitted}}
     */
    private getFileUploadConfig(cloudinaryOptions:ICloudinaryUploadRequest):ICloudinaryFileUploadConfig {

        let cloudinaryFields = _.clone(<ICloudinaryUploadRequest>_.omit(cloudinaryOptions, ['file']));
        delete cloudinaryFields._inputOptions;

        return {
            data: null, //@todo verify this is not required
            file: <File>cloudinaryOptions.file,
            url: Config.get('CLOUDINARY_ENDPOINT') + '/' + Config.get('CLOUDINARY_CLOUD_NAME') + '/image/upload',
            method: 'POST',
            fields: cloudinaryFields,
            sendFieldsAs: 'json',
        };

    }

    /**
     * Get the configuration object for the plain url upload to cloudinary
     * @param cloudinaryOptions
     */
    private getUrlUploadConfig(cloudinaryOptions:ICloudinaryUploadRequest):ICloudinaryUrlUploadConfig {

        let cloudinaryFields = _.clone(cloudinaryOptions);
        delete cloudinaryFields._inputOptions;

        return {
            file: <string>cloudinaryOptions.file,
            url: Config.get('CLOUDINARY_ENDPOINT') + '/' + Config.get('CLOUDINARY_CLOUD_NAME') + '/image/upload',
            fields: cloudinaryFields,
        };

    }

    /**
     * The parameters that must be signed in a cloudinary request
     * @type {string[]}
     */
    private cloudinarySignedParams:string[] = ['callback', 'eager', 'format', 'public_id', 'tags', 'timestamp', 'transformation', 'type'];

    /**
     * Sign the upload options using remote service which secures the api secret
     * @param uploadOptions
     * @returns {IPromise<ICloudinaryUploadRequest>}
     * @param deferredUploadProgress
     */
    private signCloudinaryUpload(uploadOptions:ICloudinaryUploadRequest, deferredUploadProgress:IImageDeferred<Image>):ng.IPromise<ICloudinaryUploadRequest> {

        let signableString:string = _.chain(this.cloudinarySignedParams)
            .filter((property):boolean => {
                return _.has(uploadOptions, property);
            })
            .map((property):string => {
                return property + '=' + uploadOptions[property];
            })
            .value()
            .sort()
            .join('&')
            ;

        //we wrap the notification in a timeout so the calling controller has a chance to register a notification listener before the first event is emitted
        this.$timeout(() => {
            deferredUploadProgress.notify({
                event: 'cloudinary_signature',
                message: "Signing request for cloudinary",
            });

        });

        return this.ngRestAdapter.get('/cloudinary/signature?' + signableString)
            .then((res:any) => {

                uploadOptions.signature = res.data.signature;
                uploadOptions.api_key = res.data.apiKey;

                return uploadOptions;
            });

    }

    /**
     * Link the cdn image to the api
     * @param uploadOptions
     * @param deferredUploadProgress
     * @param cloudinaryResponse
     * @returns {IPromise<Image>}
     */
    private linkImageToApi(uploadOptions:ICloudinaryUploadRequest, cloudinaryResponse:ng.IHttpPromiseCallbackArg<ICloudinaryUploadResponse>, deferredUploadProgress:IImageDeferred<Image>):ng.IPromise<Image> {

        let imageModel = this.modelFactory({
            imageId: cloudinaryResponse.data.public_id,
            version: cloudinaryResponse.data.version,
            format: cloudinaryResponse.data.format,
            alt: uploadOptions._inputOptions.alt,
            title: _.isString(uploadOptions._inputOptions.title) ? uploadOptions._inputOptions.title : uploadOptions._inputOptions.alt,
        });

        deferredUploadProgress.notify({
            event: 'api_link',
            message: "Uploading to API",
        });

        return this.ngRestAdapter.put('/images/' + imageModel.imageId, imageModel.getAttributes()).then(() => {
            imageModel.setExists(true);
            return imageModel;
        });

    }

}

angular.module(namespace, [])
    .service('imageService', ImageService);





