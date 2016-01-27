import * as angular from "angular";
import * as _ from "lodash";
import {NgRestAdapterService} from "angular-rest-adapter/dist/ngRestAdapter";
import {NgJwtAuthService} from "angular-jwt-auth";
import User from "../../models/user/userModel";
import State from "../../models/state/stateModel";
import SpiraException from "../../../exceptions";
import Country from "../../models/country/countryModel";
import CountryStates from "../../models/countryStates/countryStatesModel";
import Timezone from "../../models/timezone/timezoneModel";

export const namespace = 'common.services.countries';

// @Todo: This needs to be refactored to CountriesTimezonesService and tests need to be written
export default class CountriesService {

    private countriesWhichHaveStates:string[] = ['US', 'CA'];

    static $inject:string[] = ['ngRestAdapter', 'ngJwtAuthService', '$q'];

    constructor(private ngRestAdapter:NgRestAdapterService,
                private ngJwtAuthService:NgJwtAuthService,
                private $q:ng.IQService) {
    }

    private countriesCachePromise:ng.IPromise<Country[]> = null;
    private statesCachePromise:ng.IPromise<CountryStates[]> = null;
    /**
     * Get all countries from the API
     * @returns {any}
     */
    public getAllCountries():ng.IPromise<Country[]> {

        //store the promise in cache, so next time it is called the countries are resolved immediately.
        if (!this.countriesCachePromise) {
            this.countriesCachePromise = this.ngRestAdapter.get('/countries-timezones')
                .then((res) => {
                    return this.makeUserFriendlyCountries(res.data)
                })
            ;
        }
        
        return this.countriesCachePromise;
    }
    
    /**
     * Get timezones for a country
     */
    public getTimezonesByCountry(countryCode:string):ng.IPromise<Timezone[]> {
        return this.getAllCountries()
            .then((countries:Country[]) => {
                let country = _.find(countries, {'countryCode': countryCode});
                return country.timezones;
            });
    }

    public getUsersCountry():ng.IPromise<Country> {
        return this.getAllCountries()
            .then((countries:Country[]) => {
                let user = (<User>this.ngJwtAuthService.getUser());
                return _.find(countries, {'countryCode': user.country});
            });

    }

    public getUsersTimezones():ng.IPromise<Timezone[]> {

        let user = (<User>this.ngJwtAuthService.getUser());
        if (!user.country) {
            return this.$q.reject(new SpiraException("User does not have country defined"));
        }

        return this.getAllCountries()
            .then((countries:Country[]) => {
                let country = _.find(countries, {'countryCode': user.country});
                return country.timezones;
            });
    }
    
    /**
     * In some cases the country obj may need some tweaking
     */
    public makeUserFriendlyCountries(countries:Country[]) {

        // United States Minor Outlying Islands appearing before United States
        countries = _.sortBy(countries, 'countryName');

        // Edge case for Australia, move Antarctica/Macquarie to the end
        let australia:Country = _.find(countries, {'countryCode': 'AU'});
        if (australia.timezones) {
            australia.timezones = australia.timezones.concat(_.remove(australia.timezones, {'timezoneIdentifier':'Antarctica/Macquarie'}));
        }

        return countries;
    }

    /**
     * Get timezone of logged in user
     * @param fallbackIdentifier
     */
    public getUsersTimezone(fallbackIdentifier:string = 'UTC'):ng.IPromise<Timezone> {
        let user = (<User>this.ngJwtAuthService.getUser());
        return this.getUsersTimezones()
            .then((timezones) => {
                return _.find(timezones, {timezoneIdentifier: user.timezoneIdentifier ? user.timezoneIdentifier : fallbackIdentifier});
            })
            .catch(() => null);
    }
    
    /**
     * Helper function to get the timezones from the country data retrieved
     */
    public getTimezones(country:string):ng.IPromise<Timezone[]> {
        return this.getAllCountries()
            .then((countries:Country[]) => {
                let fullCountryInfo:Country = _.find(countries, {'countryCode': country});
                return fullCountryInfo.timezones;
            });
    }

    /**
     * Get all states of all countries (only US and Canada available)
     */
    public getCountriesStates():ng.IPromise<CountryStates[]> {

        // store the promise in cache
        if (!this.statesCachePromise) {
            this.statesCachePromise = this.ngRestAdapter.get('/countries/states')
                .then((res) => {
                    return _.map(res.data, (countryStateData) => {
                        countryStateData['states'] = _.map(countryStateData['states'], (state) => {
                            return new State(state);
                        });
                        return countryStateData;
                    });
                });
        }

        return this.statesCachePromise;
    }

    /**
     * Determine if a country has states
     *
     * @param countryCode
     * @returns {boolean}
     */
    public countryHasStates(countryCode:string):boolean {

        return _.includes(this.countriesWhichHaveStates, countryCode);

    }

    /**
     * Get states for a country
     *
     * @param countryCode
     * @returns {IPromise<TResult>}
     */
    public getCountryStates(countryCode:string):ng.IPromise<State[]> {

        return this.getCountriesStates().then((countriesStates:CountryStates[])=> {

            let result = _.find(countriesStates, {country:countryCode});

            return result.states;
        });
    }

}

angular.module(namespace, [])
    .service('countriesService', CountriesService);





