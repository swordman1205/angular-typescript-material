import {expect, FormControllerMock} from "../../../../testBootstrap.spec";
import * as angular from "angular";
import {MediaImageDialogController, namespace} from "./mediaImageDialog";
import ImageMock from "../../../models/image/imageModel.mock";
import Image from "../../../models/image/imageModel";
import ImageService from "../../../services/image/imageService";
import {Paginator} from "../../../services/pagination/paginationService";

describe('Select media image dialog controller', () => {

    let images:Image[] = ImageMock.collection(12),
        $rootScope:ng.IRootScopeService,
        $scope:ng.IScope,
        imageService:ImageService,
        MediaImageDialogController:MediaImageDialogController,
        $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject(($controller, _$rootScope_, _imageService_, _$q_) => {
            $rootScope = _$rootScope_;
            $scope = $rootScope.$new();

            imageService = _imageService_;
            $q = _$q_;

            let imagePaginatorMock:Paginator = imageService.getPaginator();
            imagePaginatorMock.setCount = sinon.stub().returns(imagePaginatorMock);
            imagePaginatorMock.getPages = sinon.stub().returns(3);
            imagePaginatorMock.getPage = sinon.stub().returns($q.when(images));
            imageService.getPaginator = sinon.stub().returns(imagePaginatorMock);

            MediaImageDialogController = $controller(namespace + '.controller', {
                $mdDialog: {
                    cancel: sinon.stub(),
                    hide: sinon.stub()
                },
                imageService: imageService,
                targetTab: 'upload',
                addOnlyMode: false,
            });
            MediaImageDialogController.imageUploadForm = FormControllerMock.getMock();

            $rootScope.$apply();
        });

    });

    it('should be able to resolve image paginator with initial images', () => {

        expect(MediaImageDialogController.library).to.have.length(12);
        expect(MediaImageDialogController.library[0]).to.be.instanceOf(Image);

    });

    it('should be able to toggle selection of an image', () => {

        MediaImageDialogController.selectedImage = null;

        MediaImageDialogController.toggleImageSelection(MediaImageDialogController.library[2]);

        expect(MediaImageDialogController.selectedImage).to.deep.equal(MediaImageDialogController.library[2]);

        MediaImageDialogController.toggleImageSelection(MediaImageDialogController.library[2]);

        expect(MediaImageDialogController.selectedImage).to.be.null;

    });

    it('should be able to resolve a selected image', () => {

        MediaImageDialogController.toggleImageSelection(MediaImageDialogController.library[0]);

        MediaImageDialogController.selectImage();

        expect((<any>MediaImageDialogController).$mdDialog.hide).to.have.been.calledWith(MediaImageDialogController.selectedImage);

    });

    it('should cancel the dialog when no image is selected', () => {

        MediaImageDialogController.selectedImage = null;

        MediaImageDialogController.selectImage();

        expect((<any>MediaImageDialogController).$mdDialog.cancel).to.have.been.called;

    });

    it('should be able to browse through multiple pages of images', () => {

        let pageChangePromise = MediaImageDialogController.goToPage(2);

        expect(MediaImageDialogController.currentPage).to.equal(2);

        $rootScope.$apply();

        expect(pageChangePromise).eventually.to.deep.equal(images);

    });

    it('should be able to cancel the dialog', () => {

        MediaImageDialogController.cancelDialog();

        expect((<any>MediaImageDialogController).$mdDialog.cancel).to.have.been.called;

    });

    it('should be able to upload an image', () => {

        let mockUploadDeferred = $q.defer();

        sinon.stub((<any>MediaImageDialogController).imageService, 'uploadImage').returns(mockUploadDeferred.promise); //mock the image service

        let image = {
            file: new function File() {
                this.lastModifiedDate = new Date();
                this.name = 'upload.jpg';
            },
            alt: "Image alt test",
            title: "Image title"
        };

        MediaImageDialogController.uploadImage(image);

        mockUploadDeferred.notify({
            event: 'cloudinary_signature'
        });
        mockUploadDeferred.notify({
            event: 'cloudinary_upload'
        });
        mockUploadDeferred.notify({
            event: 'api_link'
        });

        mockUploadDeferred.resolve(ImageMock.entity({title: image.title, alt: image.alt}));

        $rootScope.$apply();

        expect(MediaImageDialogController.uploadedImage).to.be.instanceOf(Image); //length should not have changed
        expect(MediaImageDialogController.uploadedImage.title).to.equal(image.title); //first image should have been pushed on
        expect(MediaImageDialogController.imageUploadForm.$setPristine).to.have.been.called;

    });
});

