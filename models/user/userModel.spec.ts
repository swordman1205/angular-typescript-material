import {expect, seededChance} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import UserMock from "./userModel.mock";
import {IUserData} from "../../services/auth/authService";
import User from "./userModel";
import Role from "../role/roleModel";
import UserSocialLogin from "./userSocialLoginModel";
import RoleMock from "../role/roleModel.mock";

describe('User Model', () => {

    let userData = <IUserData> new UserMock().getMockData();

    it('should instantiate a new user', () => {

        let user = new User(_.cloneDeep(userData)); // We have to clone the user data so that we get a fresh copy for each test

        expect(user).to.be.instanceOf(User);

    });

    it('should get custom user mock entity', () => {

        let user = UserMock.entity({userId: 'abc-123'});

        expect(user).to.be.instanceOf(User);

        expect(user.userId).to.equal('abc-123');

    });

    it('should get user mock collection', () => {

        let users = UserMock.collection(5);

        expect(users).to.be.instanceOf(Array);

        expect(users).to.have.length(5);
    });

    it('should return the user\'s full name', () => {

        let user = new User(_.cloneDeep(userData));

        expect(user.fullName).to.equal(userData.firstName + ' ' + userData.lastName);

    });

    it('should part of the user\'s full name if they don\'t have a part of their name', () => {

        let user = new User(_.cloneDeep(userData));

        user.lastName = undefined;

        expect(user.fullName).to.equal(userData.firstName);

    });

    it('should be able to check if the user is an administrator', () => {

        let adminUser = UserMock.entity({
            roles: [Role.adminRoleKey],
        });

        expect(adminUser.isAdmin()).to.be.true;

    });

    it('should be able to check if the user has a social login', () => {

        let user = new User(_.cloneDeep(userData));
        user._socialLogins = [];

        let userLoginDataFacebook = new UserSocialLogin({
            userId: user.userId,
            provider: UserSocialLogin.facebookType,
            token: seededChance.apple_token() // Closest thing to a token in Chance JS library
        });

        let userLoginDataGoogle = new UserSocialLogin({
            userId: user.userId,
            provider: UserSocialLogin.googleType,
            token: seededChance.apple_token() // Closest thing to a token in Chance JS library
        });

        user._socialLogins.push(userLoginDataFacebook, userLoginDataGoogle);

        expect(user.hasSocialLogin(UserSocialLogin.facebookType)).to.be.true;

    });

    it('should be able to check if the user does not have a social login', () => {

        let user = new User(_.cloneDeep(userData));
        user._socialLogins = [];

        let userLoginDataGoogle = new UserSocialLogin({
            userId: user.userId,
            provider: UserSocialLogin.googleType,
            token: seededChance.apple_token() // Closest thing to a token in Chance JS library
        });

        user._socialLogins.push(userLoginDataGoogle);

        expect(user.hasSocialLogin(UserSocialLogin.facebookType)).to.be.false;

    });

    it('should be able to display a set of roles in a human readable form', () => {

        let user = UserMock.entity({
            roles: ["roleName1", "roleName2"],
        });

        expect(user.rolesDisplay()).to.equal("Role Name 1, Role Name 2");

    });

    it('should fill the user role key array when hydrated', () => {

        let roles = RoleMock.collection(2);

        let user = UserMock.entity({
            _roles: roles,
        });

        expect(user.roles).to.deep.equal(_.map(roles, 'key'));
    });

});

