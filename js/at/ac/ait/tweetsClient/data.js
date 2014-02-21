/**
Copyright (C) 2014 AIT / Austrian Institute of Technology
http://www.ait.ac.at

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see http://www.gnu.org/licenses/agpl-3.0.html
*/

/**
 * @short This package defines elastic search interaction routines
 */
define('data', ['jquery', 'zoomablearea'], function () {

	// internal configuration object
	var config = {
			esUrl: 'http://ubicity.ait.ac.at:9200/geo_tweets/ctweet/',
			wikipediaUrl: 'http://ubicity.ait.ac.at:9200/wikipedia/page/',
			flickrUrl: {
				prefix: 'http://ubicity.ait.ac.at:9200/_jitindex?q=(',
				postfix: ')&m=flickr'
			},
			imagesUrl: "http://ubicity.ait.ac.at:9200/flickr/",
			maxQueryResults: 50000,
			demoSize: 10000
	};
	
	var jQuery = require('jquery');
	var zoomablearea = require('zoomablearea');

	jQuery.support.cors = true;
	
	// The Data object
    var Data = {

		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve tweets filtered by a text string from ubicity
		 */
		getTweets : function(filterString, wildcard, location, distance, callback, timeFilter) {
//			log("filterString: " + filterString);
//			log("wildcard: " + wildcard);
//			log("location: " + location);
//			log("distance: " + distance);
//			log("timeFilter: " + JSON.stringify(timeFilter));
			
			var query = {
					'match_all' : {}
			};

			var must = [];
			if (filterString != undefined && filterString != null && filterString != '') {
				if (wildcard) {
					must = [{'wildcard': {'text': filterString}}];
				} else {
					var a = filterString.split(' ');
					for (var i = 0; i < a.length; i++) {
						must.push({'text': {'text': a[i]}});
					}
				}
			}
			if (timeFilter != undefined && timeFilter != null) {
				log("timeFilter: " + JSON.stringify(timeFilter));
				var timeQuery = {
				        "created_at" : {
				            "gte" : '' + timeFilter.from,
				            "lt" : '' + timeFilter.to,
		//		            "boost" : 2.0
				        }
				};
				var range = {'range' : timeQuery};
				must.push(range);
			}
			query = {
					'query': {
						'bool': {
							'must': must
						}				
					}
				};
			// log("Query: " + JSON.stringify(query));
			var fields = ['geo', 'created_at', 'text'];
			var sort = [
			            {
			            	'created_at' : {
			            		'order' : 'desc'
			            	}
			            }
			            ]

			
			if (location != null && distance != 0) {
				var filteredQuery = {
					'fields': fields,
					'query' : {
					},
					'sort' : sort
				};
				filteredQuery.query.filtered = query;
				filteredQuery.query.filtered.filter = {
					'geo_distance' : {
		                'distance' : distance + "km",
		                'geo.coordinates' : {
		                	// GeoJSOn definition of lat/long is inverted!
		                    'lon' : location.lat,
		                    'lat' : location.lng
		                },
		                'distance_type' : 'arc'
		            }
				};
				jQuery.post(config.esUrl + '_search?search_type=count', JSON.stringify(filteredQuery), function(data) {
//					log("Count Query:");
//					log("Count: " + data.hits.total);
//					log("Time: " + data.took);
					if (data.hits.total == 0) {
						callback(data);
					} 
					else if (data.hits.total > config.maxQueryResults) {
						callback(data);
					} else {
						filteredQuery.size = data.hits.total;
						// log("FilteredQuery: " + JSON.stringify(filteredQuery));
						jQuery.post(config.esUrl + '_search', JSON.stringify(filteredQuery), function(data) {
//							log("Search Query:");
//							log("Count: " + data.hits.total);
//							log("Time: " + data.took);
							callback(data);
						});
					}
				}).fail(function(xhr, status, errorThrown) {alert('Error when calling Twitter index!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText);});
			} else {
				// log("Query: " + JSON.stringify(query));
				jQuery.post(config.esUrl + '_search?search_type=count', JSON.stringify(query), function(data) {
//					log("Count Query:");
//					log("Count: " + data.hits.total);
//					log("Time: " + data.took);
					if (data.hits.total == 0) {
						callback(data);
					} 
					else if (data.hits.total > config.maxQueryResults) {
						callback(data);
					} else {
						query.fields = fields;
						query.sort = sort;
//						var size = data.hits.total; For demo reasons (-> performance) we limit size to 5000!!!!
						var size = config.demoSize;
						query.size = size;
						jQuery.post(config.esUrl + '_search', JSON.stringify(query), function(data) {
//							log("Search Query:");
//							log("Count: " + data.hits.total);
//							log("Time: " + data.took);
							callback(data);
						});
					}
				}).fail(function(xhr, status, errorThrown) {alert('Error when calling Twitter index!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText);});

			}

		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve Flickr images filtered by a text string from ubicity
		 */
		getFlickrImages : function(filterString, wildcard, callback) {

			jQuery.get(config.flickrUrl.prefix + filterString + config.flickrUrl.postfix, '', function(data) {
				var query = {
						'query': {
							'bool': {
								'must': [{match_all: {}}]
							}				
						},
						size: 20
					};
				var filterWithoutSpaces = filterString.replace(/\s+/g,"").toLowerCase();
				(function loopsiloop(){
					   setTimeout(function(){
						   jQuery.post(config.imagesUrl + filterWithoutSpaces + '/_search', JSON.stringify(query), function(data) {
							   if (data.hits.hits.length > 0) {
								   var images = [];
								   for (var i = 0; i < data.hits.hits.length; i++) {
										images.push(data.hits.hits[i]._source.url);
									}
									callback(images);
							   } else {
					               loopsiloop(); // recurse
							   }
				           }).fail(function(xhr, status, errorThrown) {
				        	   alert('Error when calling Flickr index!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText);
				           }
				       );
				   }, 1000);
				})();
			}).fail(function(xhr, status, errorThrown) {alert('Error when indexing Flickr content!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText);});
		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve Wikipedia pages and links filtered by a text string from ubicity
		 */
		getWikipedia : function(filterString, wildcard, callback) {
			var query = {
					'match_all' : {}
			};

			var must = [];
			if (filterString != undefined && filterString != null && filterString != '') {
				if (wildcard) {
					must = [{'wildcard': {'page.title': filterString}}];
				} else {
					var a = filterString.split(' ');
					for (var i = 0; i < a.length; i++) {
						must.push({'text': {'page.title': a[i]}});
					}
				}
			}
			query = {
					'query': {
						'bool': {
							'must': must
						}				
					}
				};
			 log("Query: " + JSON.stringify(query));
			var fields = ['title', 'link', 'special'];
			jQuery.post(config.wikipediaUrl + '_search?search_type=count', JSON.stringify(query), function(data) {
				log("Count Query:");
				log("Count: " + data.hits.total);
				log("Time: " + data.took);
				if (data.hits.total == 0) {
					showDialog('Ubicity Tweets', '<br><br>There are no wikipedia pages matching your search string.', 'warning');
					cursor_default();
				} else {
					query.fields = fields;
					var size = data.hits.total;
					query.size = size;
					jQuery.post(config.wikipediaUrl + '_search', JSON.stringify(query), function(data) {
						log("Search Query:");
						log("Count: " + data.hits.total);
						log("Time: " + data.took);
						callback(data);
					});
				}
			}).fail(function(xhr, status, errorThrown) {alert('Error when calling Wikipedia index!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText);});

		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Redraw the d3 time scale diagram
		 */
		updateDiagram : function(data) {
			// update d3 diagram:
			var hits = data.hits.hits.reverse();
			if (hits.length > 0) {
				var diagramData = new Array();
				var hitDate = null;
				var day_i = null;
				// initalize diagramData with value=0 for each hour between minimum and maximum tweets dates
				hitDate = new Date(parseTwitterDate(hits[0].fields.created_at));
				// log("minHit: " + JSON.stringify(hitDate));
				var minDate = new Date(hitDate.getFullYear(), hitDate.getMonth(), hitDate.getDate(), 1);
				// log("minDate: " + JSON.stringify(minDate));
				hitDate = new Date(parseTwitterDate(hits[hits.length - 1].fields.created_at));
				// log("maxHit: " + JSON.stringify(hitDate));
				var maxDate = new Date(hitDate.getFullYear(), hitDate.getMonth(), hitDate.getDate(), 24);
				// log("maxDate: " + JSON.stringify(maxDate));
				for (var d = minDate; d <= maxDate; d.setDate(d.getDate()+1)) {
					for (var h = 1; h <= 24; h++) {
						diagramData.push({date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h), value: 0});
						// log(JSON.stringify(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h)));
					}
				}
				for (var i = 0; i < hits.length ; i++) {
					/*
					 * Tweets field created_at has following format: Sat Nov 02 04:46:33 +0000 2013
					 * since we want to scale down to hourly values only, we eliminate minutes and seconds
					 * from the date string:
					 */
					hitDate = new Date(parseTwitterDate(hits[i].fields.created_at));
					day_i = new Date(hitDate.getFullYear(), hitDate.getMonth(), hitDate.getDate(), hitDate.getHours());
					for (var j = 0; j < diagramData.length; j++){
						if (diagramData[j].date.getTime() == day_i.getTime()) {
							diagramData[j].value++;
						}
					}
				}
				zoomablearea.initData(diagramData);
/*				for (var j = 0; j < diagramData.length; j++){
					log(JSON.stringify(diagramData[j]));
				}
*/
			} else {
				zoomablearea.reset();
			}
		},
    };
    
    return Data;
});


