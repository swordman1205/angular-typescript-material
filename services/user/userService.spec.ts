import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {NgJwtAuthService} from "angular-jwt-auth";
import UserService, {IPurchaseRequest, IPurchaseRequestUser} from "./userService";
import UserMock from "../../models/user/userModel.mock";
import User from "../../models/user/userModel";
import UserCredential from "../../models/user/userCredentialModel";
import UserProfileMock from "../../models/user/userProfileModel.mock";
import RoleMock from "../../models/role/roleModel.mock";
import ProgramRatePlanMock from "../../models/programRatePlan/programRatePlan.mock";
import MealPlanMock from "../../models/mealPlan/mealPlanModel.mock";
import CycleMock from "../../models/cycle/cycleModel.mock";
import ZuoraInvoiceMock from "../../models/zuoraInvoice/zuoraInvoiceModel.mock";
import ZuoraPaymentMethodMock from "../../models/zuoraPaymentMethod/zuoraPaymentMethodModel.mock";
import {momentExtended as moment} from "../../../common/libs/moment/moment";
import ProgramMock from "../../models/program/programModel.mock";

// Mocks
let fixtures = {
    uuid() {
        return 'aa80a1a2-7e65-4375-ad25-5eb18e20a2c1';
    }
};

describe('UserService', () => {

    let userService:UserService;
    let $httpBackend:ng.IHttpBackendService;
    let authService:NgJwtAuthService;
    let ngRestAdapter:NgRestAdapterService;
    let $mdDialog:ng.material.IDialogService;
    let $timeout:ng.ITimeoutService;
    let $rootScope:ng.IRootScopeService;
    let $log:ng.ILogService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _userService_, _ngJwtAuthService_, _ngRestAdapter_, _$mdDialog_, _$timeout_, _$rootScope_, _$log_) => {

            if (!userService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                userService = _userService_;
                authService = _ngJwtAuthService_;
                ngRestAdapter = _ngRestAdapter_;
                $mdDialog = _$mdDialog_;
                $timeout = _$timeout_;
                $rootScope = _$rootScope_;
                $log = _$log_;
            }

            ngRestAdapter.uuid = sinon.stub().returns('foobar');

        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(userService).to.be.an('object');
        });

    });

    describe('Retrieving User/Users', () => {

        it('should be able to retrieve full info for one user', () => {

            let user = _.clone(UserMock.entity());

            $httpBackend.expectGET('/api/users/' + user.userId,
                (headers) => /userCredential, userProfile, socialLogins/.test(headers['With-Nested'])
            ).respond(200);

            let userDetailsPromise = userService.getModel(user.userId, ['userCredential', 'userProfile', 'socialLogins']);

            expect(userDetailsPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

        it('should not request `With-Nested` when nested entities are not requested', () => {

            let user = UserMock.entity();

            $httpBackend.expectGET('/api/users/' + user.userId,
                (headers) => !_.has(headers, 'With-Nested')
            ).respond(200);

            let userDetailsPromise = userService.getModel(user.userId);

            expect(userDetailsPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();
        });

        it('should return a new user created from user data', () => {

            let userData = _.clone(UserMock.entity());

            let user = userService.modelFactory(userData);

            expect(user).to.be.instanceOf(User);

            expect(userData.email).to.equal(user.email);

            expect(userData.userId).to.equal(user.userId);

        });

        it('should be able to get a user from auth', () => {

            sinon.spy(authService, 'getUser');

            userService.getAuthUser();

            expect(authService.getUser).to.have.been.called;

            (<any>authService).getUser.restore();

        });

        describe('Retrieve a user paginator', () => {

            beforeEach(() => {

                sinon.spy(ngRestAdapter, 'get');

            });

            afterEach(() => {
                (<any>ngRestAdapter.get).restore();
            });

            let users = _.clone(UserMock.collection()); // Get a set of users

            it('should return the first set of users', () => {

                $httpBackend.expectGET('/api/users').respond(_.take(users, 10));

                let usersPaginator = userService.getUsersPaginator();

                let firstSet = usersPaginator.getNext(10);

                expect(firstSet).eventually.to.be.fulfilled;
                expect(firstSet).eventually.to.deep.equal(_.take(users, 10));

                $httpBackend.flush();

            });

        });

    });

    describe('User Registration', () => {

        before(() => authService.logout()); //make sure we are logged out

        describe('Username/Password (non social)', () => {

            it('should be able to create a new user and attempt login immediately', () => {

                let user = UserMock.entity();
                user._userCredential = new UserCredential({
                    password: 'hunter2',
                });

                $httpBackend.expectPOST(/\/api\/users\/.+/, (requestObj) => {
                    let requestObject = JSON.parse(requestObj);
                    return _.every(['userId', 'email', 'username', 'firstName', 'lastName'], (key) => _.has(requestObject, key));
                }).respond(201);

                $httpBackend.expectPUT(/\/api\/users\/.+\/credentials/, (requestObj) => {
                    let requestObject = JSON.parse(requestObj);
                    return _.every(['userId', 'password'], (key) => _.has(requestObject, key));
                }).respond(204);

                $httpBackend.expectGET('/api/auth/jwt/login', (headers) => /Basic .*/.test(headers['Authorization'])).respond(200);
                //note the above auth request does not return a valid token so the login will not be successful so we can't test for that

                userService.registerAndLogin(user.email, user.username, user._userCredential.password, user.firstName, user.lastName);

                $httpBackend.flush();

            });

        });

    });

    describe('Password Reset', () => {

        it('should open the password reset dialog', () => {

            sinon.spy($mdDialog, 'show');

            userService.promptResetPassword();

            $timeout.flush();

            expect($mdDialog.show).to.have.been.called;

            (<any>$mdDialog).show.restore();

        });

        it('should be able to send a reset password email', () => {

            let email = 'test@email.com';

            $httpBackend.expectDELETE('/api/users/' + email + '/password').respond(202);

            let resetPasswordPromise = userService.resetPassword(email);

            expect(resetPasswordPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

    });

    describe('Change Email', () => {

        it('should be able to send a patch request to confirm email change', () => {

            let user = _.clone(UserMock.entity());

            const emailToken = 'cf8a43a2646fd46c2081960ff1150a6b48d5ed062da3d59559af5030eea21548';

            $httpBackend.expectPATCH('/api/users/' + user.userId,
                (jsonData:string) => {
                    let data:{emailConfirmed:string} = JSON.parse(jsonData);
                    return data.emailConfirmed && moment(data.emailConfirmed).isValid();
                },
                (headers) => {
                    return headers['email-confirm-token'] == emailToken;
                }).respond(202);

            let emailConfirmationPromise = userService.confirmEmail(user, emailToken);

            expect(emailConfirmationPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();
        });

        it('should reject the promise if a bogus user id is passed through', () => {

            let user = _.clone(UserMock.entity());
            user.userId = 'bogus-user-id';

            const emailToken = 'cf8a43a2646fd46c2081960ff1150a6b48d5ed062da3d59559af5030eea21548';

            $httpBackend.expectPATCH('/api/users/' + user.userId).respond(422);

            let emailConfirmationPromise = userService.confirmEmail(user, emailToken);

            expect(emailConfirmationPromise).eventually.to.be.rejected;

            $httpBackend.flush();
        });

    });

    describe('Update Details', () => {

        it('should be able to send a patch request to update the user details (including profile)', () => {

            let user = UserMock.entity();

            user.firstName = 'Joe';
            user._userProfile = UserProfileMock.entity();
            user._userProfile.dob = moment('1995-01-01');
            user._userProfile.about = 'Ipsum';

            $httpBackend.expectPATCH('/api/users/' + user.userId, (jsonData:string) => {
                let data:User = JSON.parse(jsonData);
                return data.firstName == user.firstName;
            }).respond(204);

            $httpBackend.expectPATCH('/api/users/' + user.userId + '/profile', (jsonData:string) => {
                let data:any = JSON.parse(jsonData);
                return data.dob == user._userProfile.dob.toISOString() && data.about == user._userProfile.about;
            }).respond(204);

            let profileUpdatePromise = userService.saveUserWithRelated(user);

            $rootScope.$apply();

            expect(profileUpdatePromise).eventually.to.be.fulfilled;

            $httpBackend.flush();
        });

        it('should not make an api call if nothing has changed', () => {

            let user = UserMock.entity({
                _userProfile: UserProfileMock.entity(null, true),
            }, true);

            let savePromise = userService.saveUserWithRelated(user);

            expect(savePromise).eventually.to.equal(user);

        });

        it('should update the region setting when the user updates their profile', () => {

            let user = UserMock.entity({
                regionCode: 'us',
                _userProfile: UserProfileMock.entity(null, true),
            }, true);

            $httpBackend.expectPATCH('/api/users/' + user.userId, {
                regionCode: 'au',
            }).respond(204);

            user.regionCode = 'au';

            let savePromise = userService.saveUserWithRelated(user);

            $httpBackend.flush();

            expect(savePromise).eventually.to.equal(user);

        });

        it('should save roles for a user', () => {

            let roles = RoleMock.collection(2);

            let user = UserMock.entity({}, true);

            user._roles = roles;

            let roleData = _.map(roles, (role) => _.pick(role, 'key'));

            $httpBackend.expectPUT('/api/users/' + user.userId + '/roles', roleData).respond(204);

            let savePromise = userService.saveUserRoles(user);

            $httpBackend.flush();

            expect(savePromise).eventually.to.equal(user);
        });

        it('should not save roles when they are unchanged', () => {

            let roles = RoleMock.collection(2);

            let user = UserMock.entity({
                _roles: roles,
                roles: _.map(roles, 'key')
            }, true);

            let savePromise = userService.saveUserRoles(user);

            expect(savePromise).eventually.to.equal(user);
        });

    });

    describe('Payments & Subscriptions', () => {

        let user = UserMock.entity();

        let selectedProgram = ProgramMock.entity(),
            selectedCycle = CycleMock.entity({
                programId: selectedProgram.programId
            }),
            selectedRatePlan = ProgramRatePlanMock.entity(),
            selectedCurrency = 'AUD',
            selectedMealPlan = MealPlanMock.entity(),
            paymentRefId = 'foobar',
            promoCode = 'IQSSTAFF';

        let request:IPurchaseRequest = {
            programCycleId: selectedCycle.getKey(),
            programKey: selectedProgram.programKey,
            userId: user.getKey(),
            zPaymentMethodId: paymentRefId,
            zProductRatePlanId: selectedRatePlan.ratePlanId,
            zCurrency: selectedCurrency,
            mealPlanId: selectedMealPlan.getKey(),
            promoCode: promoCode,
            _user: <IPurchaseRequestUser>{
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                userId: user.getKey(),
                country: user.country,
            }
        };

        afterEach(() => {
            $httpBackend.flush();
        });

        it('should be able to make a purchase (409 error)', () => {

            $httpBackend.expectPOST('/api/users/' + user.userId + '/purchases', request).respond(409, 'Error Message');

            let failingPromise = userService.purchaseProgram(user, selectedProgram, selectedCycle, selectedRatePlan, selectedCurrency, selectedMealPlan, paymentRefId, promoCode);

            expect(failingPromise).eventually.to.be.rejected;
            expect(failingPromise).eventually.to.deep.equal('The email you have entered is already associated with an account, please log in or use a different email to continue.');

        });

        it('should be able to make a purchase (422 error)', () => {

            $httpBackend.expectPOST('/api/users/' + user.userId + '/purchases', request).respond(422, 'Error Message');
            $httpBackend.expectPOST((url:string):boolean => {
                return !!url.match('/.*logs\-01\.loggly\.com\/inputs\/.*Angular.*/');
            }).respond(200);

            let failingPromiseTwo = userService.purchaseProgram(user, selectedProgram, selectedCycle, selectedRatePlan, selectedCurrency, selectedMealPlan, paymentRefId, promoCode);

            expect(failingPromiseTwo).eventually.to.be.rejected;
            expect(failingPromiseTwo).eventually.to.deep.equal('Unable to sign you up for program, please try again.');

        });

        it('should be able to make a purchase (success)', () => {

            $httpBackend.expectPOST('/api/users/' + user.userId + '/purchases', request).respond(200, 'Success Message');

            let promiseSuccess = userService.purchaseProgram(user, selectedProgram, selectedCycle, selectedRatePlan, selectedCurrency, selectedMealPlan, paymentRefId, promoCode);

            expect(promiseSuccess).eventually.to.be.fulfilled;

        });

        it('should be able to update a user\'s payment method', () => {

            let user = UserMock.entity();
            let paymentMethodId = 'foobar';

            $httpBackend.expectPUT('/api/users/' + user.userId + '/payment-method/' + paymentMethodId, null).respond(200);

            userService.updatePaymentMethod(user, paymentMethodId);

        });

        it('should be able to get a user\'s invoices', () => {

            let invoices = ZuoraInvoiceMock.collection(2);

            $httpBackend.expectGET('/api/users/' + user.userId + '/invoices').respond(invoices);

            let results = userService.getInvoices(user);

            expect(results).eventually.to.be.fulfilled;
            expect(results).eventually.to.deep.equal(invoices);

            $httpBackend.expectGET('/api/users/' + user.userId + '/invoices').respond(404);

            let resultsNotFound = userService.getInvoices(user);

            expect(resultsNotFound).eventually.to.be.fulfilled;
            expect(resultsNotFound).eventually.to.deep.equal([]);

        });

        it('should be able to get a user\'s payment method', () => {

            let paymentMethod = ZuoraPaymentMethodMock.entity();

            $httpBackend.expectGET('/api/users/' + user.userId + '/payment-method').respond(paymentMethod);

            let results = userService.getPaymentMethod(user);

            expect(results).eventually.to.be.fulfilled;
            expect(results).eventually.to.deep.equal(paymentMethod);

            $httpBackend.expectGET('/api/users/' + user.userId + '/payment-method').respond(404);

            let resultsNotFound = userService.getPaymentMethod(user);

            expect(resultsNotFound).eventually.to.be.fulfilled;
            expect(resultsNotFound).eventually.to.be.null;


        });

    });

    describe('Update Meal Plan', () => {

        it('should be able to send a put request to confirm meal plan change', () => {

            let user = UserMock.entity();
            user._purchasedMealPlans = MealPlanMock.collection(2);
            let fromMealPlan = _.head(user._purchasedMealPlans);
            let toMealPlan = _.last(user._purchasedMealPlans);

            $httpBackend.expectPUT('/api/users/' + user.userId + '/meal-plans/' + fromMealPlan.mealPlanId + '/replace-with/' + toMealPlan.mealPlanId)
                .respond(201);

            let updateMealPlanPromise = userService.updateMealPlan(user, fromMealPlan, toMealPlan);

            expect(updateMealPlanPromise).eventually.to.be.fulfilled;
            expect(updateMealPlanPromise).to.eventually.deep.equal(toMealPlan);

            $httpBackend.flush();
        });

    });

    describe('Utility', () => {

        it('should be able to create a new user from admin', () => {
            let user = UserMock.entity();
            user.userId = ngRestAdapter.uuid();

            $httpBackend.expectPOST('/api/users/' + user.userId).respond(200);
            $httpBackend.expectPUT('/api/users/' + user.userId + '/credentials').respond(204);

            let userId = userService.adminCreateUser(user.email);
            expect(userId).to.eventually.equal(user.userId);

            $httpBackend.flush();
        });

        it.skip('should be able to create a new user', () => {
            // @Todo: Write me
        });

        it.skip('should be able to create new user credentials', () => {
            // @Todo: Write me
        });

    });

});

