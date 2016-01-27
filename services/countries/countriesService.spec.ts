import {expect} from "../../../testBootstrap.spec";
import * as _ from "lodash";
import CountriesService from "./countriesService";
import {NgRestAdapterService} from "angular-rest-adapter";

let seededChance = new Chance(1);
let fixtures = {

    getCountries() {

        let countries = (<any>seededChance).countries(),
            mapped = _.chain(countries)
                .map((country:{abbreviation:string, name:string}) => {
                    return {
                        countryCode: country.abbreviation,
                        countryName: country.name,
                    };
                })
                .value();

        return mapped;

    }
};
let allStates = [
    {
        'country':'US',
        'states':[
            { NY:'New York' },
            { NV:'Nevada' },
            { OH:'Ohio' }
        ]
    },
    {
        'country':'CA',
        'states':[
            { AB:'Alberta' },
            { BC:'British Columbia' }
        ]
    }
];

describe('CountriesService', () => {

    let countriesService:CountriesService;
    let $httpBackend:ng.IHttpBackendService;
    let ngRestAdapter:NgRestAdapterService;
    let $q:ng.IQService;

    beforeEach(() => {

        angular.mock.module('app');

        angular.mock.inject((_$httpBackend_, _countriesService_, _ngRestAdapter_, _$q_) => {

            if (!countriesService) { //dont rebind, so each test gets the singleton
                $httpBackend = _$httpBackend_;
                countriesService = _countriesService_;
                ngRestAdapter = _ngRestAdapter_;
                $q = _$q_;
            }
        });

    });

    afterEach(() => {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('Initialisation', () => {

        it('should be an injectable service', () => {

            return expect(countriesService).to.be.an('object');
        });

    });

    describe('Retrieve countries', () => {

        beforeEach(() => {

            sinon.spy(ngRestAdapter, 'get');

        });

        afterEach(() => {
            (<any>ngRestAdapter.get).restore();
        });

        let countries = _.clone(fixtures.getCountries()); //get a set of countries

        it('should return all countries', () => {

            $httpBackend.expectGET('/api/countries-timezones').respond(countries);

            let allCountriesPromise = countriesService.getAllCountries();

            expect(allCountriesPromise).eventually.to.be.fulfilled;
            expect(allCountriesPromise).eventually.to.deep.equal(countries);

            $httpBackend.flush();

        });

        it('should return all countries from cache', () => {

            let allCountriesPromise = countriesService.getAllCountries();

            expect(allCountriesPromise).eventually.to.be.fulfilled;
            expect(allCountriesPromise).eventually.to.deep.equal(countries);

            expect(ngRestAdapter.get).not.to.have.been.called;

        });

    });

    describe('Retrieve states', () => {

        beforeEach(() => {

            sinon.spy(ngRestAdapter, 'get');

        });

        afterEach(() => {
            (<any>ngRestAdapter.get).restore();
        });

        it('should return all states', () => {

            $httpBackend.expectGET('/api/countries/states').respond(allStates);
            let usStatesPromise = countriesService.getCountriesStates();
            expect(usStatesPromise).eventually.to.be.fulfilled;

            $httpBackend.flush();

        });

        it('should be able to return a country\'s states', () => {

            countriesService.getCountriesStates = sinon.stub().returns($q.when(allStates));

            let promise = countriesService.getCountryStates('US');

            expect(promise).to.eventually.deep.equal([
                { NY:'New York' },
                { NV:'Nevada' },
                { OH:'Ohio' }
            ]);

        });

    });

    describe('Utility', () => {

        it('should be able to determine if a country has states', () => {

            expect(countriesService.countryHasStates('US')).to.be.true;

            expect(countriesService.countryHasStates('NZ')).to.be.false;

        });

    });

});

