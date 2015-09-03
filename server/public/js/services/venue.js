'use strict';

VenueFactory.$inject = ['$http', '$q'];
angular.module('iTravelApp').factory('Venue', VenueFactory);

function VenueFactory($http, $q) {

	// constructor
	function Venue(config) {
		angular.extend(this, config);
	}

	// instance properties/methods
	Venue.prototype = {
	};

	// static properties/methods
	Venue.searchResults = {};
	Venue.categoryDict = {};
	Venue.explore = sectionedExplore;
	Venue.getDetails = getDetails;


	/**
	 *
	 */
	function sectionedExplore(params) {
		angular.extend(params, {limit: 50});

		var promiseHash = {
			drinks: singleExplore(copyAndExtend(params, {section: 'drinks'})),
			food: singleExplore(copyAndExtend(params, {section: 'food'})),
			arts: singleExplore(copyAndExtend(params, {section: 'arts'})),
			outdoors: singleExplore(copyAndExtend(params, {section: 'outdoors'})),
			sights: singleExplore(copyAndExtend(params, {section: 'sights'})),
			hotels: singleExplore(copyAndExtend(params, {query: 'Hotel'}))
		};



		return $q.all(promiseHash)
			.then(function success(resultsHash) {
				var sectionedresults = {};

				sectionedresults.restaurants = _.uniq([].concat(resultsHash.drinks, resultsHash.food), 'id');
				sectionedresults.attractions = _.uniq([].concat(resultsHash.arts, resultsHash.outdoors, resultsHash.sights), 'id');
				sectionedresults.hotels = resultsHash.hotels;

				Venue.searchResults = sectionedresults;
				Venue.categoryDict = getCategoryDict(sectionedresults);

				console.log('Venue.categoryDict', Venue.categoryDict);

				return sectionedresults;
			}, function fail() {
				return $q.reject();
			});
	}

	/**
	 * call the backend foursquare proxy
	 * @return {promise}
	 */
	function singleExplore(params) {
		var deferred = $q.defer();

		$http.get('foursquare/explore', {
			cache: true,
			params: params
		}).then(function(res) {
			var venueArray;
			// console.log('res from calling backend', res);
			if(res.status > 399) {
				deferred.reject(res.meta.message);
			} else {
				venueArray = _.map(res.data, function(venue){
					return new Venue(venue);
				});
				deferred.resolve(venueArray);
			}
		}, function(err) {
			deferred.reject(err);
		});

		return deferred.promise;
	}

	function getCategoryDict(searchResults) {
		var allVenues, categoryDict = {};

		allVenues = [].concat(searchResults.restaurants, searchResults.attractions, searchResults.hotels);
		_.each(searchResults, function(venues, section){
			var categoryMap=[];

			//manual hack to put an "all" category for each venue type section
			categoryMap.push({name: "All", count: 1000, level: 1});

			_.each(venues, function(venue) {
				_.each(venue.categories, function(catetory, idx) {
					var matched = _.findWhere(categoryMap, {name: catetory.name});
					if (matched) {
						matched.count++;
					} else {
						categoryMap.push({name: catetory.name, count: 1, level: idx});
					}
				});
			});

			categoryDict[section] = _.sortBy(categoryMap, 'count');

		});

		return categoryDict;
	}

	function getDetails(venueId) {
		var deferred = $q.defer();
		$http.get('foursquare/venues/' + venueId, {
			cache: true,
		}).then(function(res) {
			if(res.status > 399) {
				deferred.reject(res.meta.message);
			} else {
				deferred.resolve(res.data);
			}
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	}

	function copyAndExtend(src, ext) {
		return angular.extend(angular.copy(src), ext);
	}

	return Venue;
}
