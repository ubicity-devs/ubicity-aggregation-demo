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
define('data', ['jquery', 'zoomablearea', 'elasticsearch'], function () {

	// internal configuration object
	var config = {
			esUrl: 'http://ubicity.ait.ac.at:8080/es/',
			twitter : {
				index: 'all_geo_tweets',
				type: 'ctweet'
			},
			wikipedia: {
				index: 'wikipedia',
				type: 'page'
			},
			flickrUrl: {
				prefix: '_jitindex?q=(',
				postfix: ')&m=flickr'
			},
			flickr: {
				index: 'flickr',
				type : ''
			},
			maxQueryResults: 100000,
			demoSize: 10000,
	};
	
	var jQuery = require('jquery');
	var zoomablearea = require('zoomablearea');
	var ejs = require('elasticsearch');
	
	var esClient = null;

	jQuery.support.cors = true;
	
	// The Data object
    var Data = {

		// ---------------------------------------------------------------------------------------------------
		

    	/**
    	 * @short Initialize the data object. The init()-Function is called in this file, right before the return statement
    	 */
    	init : function() {
    		/* setup client */
			esClient = new ejs.Client({
				host: config.esUrl,
			    log: 'debug'
			  });
    	},
    	
    	/**
		 * @short Retrieve tweets filtered by a text string from ubicity
		 */
		getTweets : function(filterString, wildcard, location, distance, callback, timeFilter) {
			log("filterString: " + filterString);
			log("wildcard: " + wildcard);
			log("location: " + JSON.stringify(location));
			log("distance: " + distance);
			log("timeFilter: " + JSON.stringify(timeFilter));
			
			var query = {
					'match_all' : {}
			};

			var must = [];
			if (filterString != undefined && filterString != null && filterString != '') {
				if (wildcard) {
					must = [{'wildcard': {'ctweet.text': filterString}}];
				} else {
					var a = filterString.split(' ');
					for (var i = 0; i < a.length; i++) {
						if (a[i] != undefined && a[i] != null && a[i] != '') {
							must.push({'term': {'ctweet.text': a[i].trim().toLowerCase()}});
						}
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
			
			var fields = ['coordinates.coordinates', 'created_at', 'text'];
			var sort = [{
            	'created_at' : {
            		'order' : 'desc'
            	}
            }];
			
			if (location != null && distance != 0) { // filtered query by geographical area
				var filteredQuery = {
					'query' : {
					},
				};
				filteredQuery.query.filtered = query;
				filteredQuery.query.filtered.filter = {
					'geo_distance' : {
		                'distance' : distance + "km",
		                'coordinates.coordinates' : {
		                    'lat' : location.lat,
		                    'lon' : location.lng
		                },
		                'distance_type' : 'arc'
		            }
				};
				// first get amount of tweets matching the search query:
				log("FilteredQuery: " + JSON.stringify(filteredQuery));
				esClient.count({
					  index: config.twitter.index,
					  type: config.twitter.type,
					  body: filteredQuery
				}, function (error, resp, status) {
						if (error || resp == null) {
							console.log(JSON.stringify(error));
							showDialog('Ubicity Demo', 'Error when calling Twitter index!\n' + error + '\n' + status +'\n', 'error');
						} else {
							console.log('Found ' + resp.count + ' twitter entries.');
						
							if (resp.count == 0 || resp.count > config.maxQueryResults) {
								callback(null, resp.count);
							} else {
								filteredQuery.size = resp.count;
								filteredQuery.fields = fields;
								filteredQuery.sort = sort;
								log("FilteredQuery: " + JSON.stringify(filteredQuery));
								esClient.search({
									  index: config.twitter.index,
									  type: config.twitter.type,
									  body: filteredQuery
									}).then(function (resp) {
										if (resp == null) {
											cursor_default();
											showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
										} else {
											log("Search Query:");
											log("Count: " + resp.hits.total);
											log("Time: " + resp.took);
											callback(resp);
										}},
										function (error) {
											log('Error in search call for Twitter index: ' + error.message); 
											cursor_default();
											showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
										});
									}
								}
							}
					);
			} else { // query not filtered by geographical area nor by time
				// first get amount of tweets matching the search query:
				esClient.count({
					  index: config.twitter.index,
					  type: config.twitter.type,
					  body: query
				}, function (error, resp, status) {
					if (error || resp == null) {
						console.log(JSON.stringify(error));
						cursor_default();
						showDialog('Ubicity Demo', 'Error when calling Twitter index!\n' + error + '\n' + status +'\n', 'error');
					} else {
						if (resp.count == 0 || resp.count > config.maxQueryResults) {
							callback(null, resp.count);
						} else {
							query.fields = fields;
							query.sort = sort;
							var size = resp.count; 
							// For demo reasons (-> performance) we limit size!!!
							var size = config.demoSize;
							query.size = size;
							log("Twitter Query: " + JSON.stringify(query));
							esClient.search({
								  index: config.twitter.index,
								  type: config.twitter.type,
								  body: query
								}).then(function (resp) {
									if (resp == null) {
										cursor_default();
										showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
									} else {
										log("Twitter Search Query:");
										log("Twitter Count: " + resp.hits.total);
										log("Twitter Time: " + resp.took);
										callback(resp);
									}
								},
								function (error) {
									log('Error in search call for twitter index: ' + error.message); 
									cursor_default();
									showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
								});
							}
						}
					}
					);
			}

		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve Flickr images filtered by a text string from ubicity
		 */
		getFlickrImages : function(filterString, wildcard, callback) {

			// create new es index for filterString on server
			var url = config.esUrl + config.flickrUrl.prefix + filterString + config.flickrUrl.postfix;
			jQuery.get(url, '', function(data) {
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
							log("Flickr Query: " + JSON.stringify(query));
							esClient.search({
								  index: config.flickr.index,
								  type: filterWithoutSpaces,
								  body: query
								}).then(function (resp) {
									if (resp == null) {
										Slideshow.reset();
										cursor_default();
										showDialog('Ubicity Demo', 'Error when calling Flickr index!\n', 'error');
									} else {
									if (resp.hits.hits.length > 0) {
										   var images = [];
										   for (var i = 0; i < resp.hits.hits.length; i++) {
												images.push(resp.hits.hits[i]._source.url);
											}
											callback(images);
									   } else {
							               loopsiloop(); // recurse
									   }
									}
								},
								function (error) {
									log('Error in search call for Flickr index: ' + error.message); 
									Slideshow.reset();
									cursor_default();
									showDialog('Ubicity Demo', 'Error when calling Flickr index!\n', 'error');
								})
							}, 1000
				       );
				   })();
			}).fail(function(xhr, status, errorThrown) {
				Slideshow.reset();
				showDialog('Ubicity Demo', 'Error when indexing Flickr content!\n' + errorThrown+'\n'+status+'\n'+xhr.statusText, 'error');
			});
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
				var a = filterString.split(' ');
				for (var i = 0; i < a.length; i++) {
					if (a[i] != undefined && a[i] != null && a[i] != '') {
						must.push({'term': {'title': a[i].trim().toLowerCase()}});
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
			log("Wikipedia Count Query: " + JSON.stringify(query));
			esClient.count({
				  index: config.wikipedia.index,
				  type: config.wikipedia.type,
				  body: query
			}, function (error, resp, status) {
				if (error || resp == null) {
					console.log(JSON.stringify(error));
					Data.deleteWikipediaGraph();
					showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n' + error + '\n' + status +'\n', 'error');
				} else {
					if (resp.count == 0) {
						Data.deleteWikipediaGraph();
						cursor_default();
						showDialog('Ubicity Demo', '<br><br>There are no wikipedia pages matching your search string.', 'warning');
					} else {
						var fields = ['title', 'link', 'special'];
						query.fields = fields;
						log("Wikipedia Query: " + JSON.stringify(query));
						esClient.search({
							  index: config.wikipedia.index,
							  type: config.wikipedia.type,
							  body: query
							}).then(function (resp) {
								if (resp == null) {
									cursor_default();
									showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n', 'error');
								} else {
									callback(resp.hits.hits);
								}
							},
							function (error) {
								log('Error in search call for Wikipedia index: ' + error.message);
								cursor_default();								
								showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n', 'error');
							});
						}
					}
				}
			);
		},
		
		deleteWikipediaGraph : function() {
			$("#wikipedia").empty();
		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Redraw the d3 time scale diagram
		 */
		updateDiagram : function(data) {
			// update d3 diagram:
			if (data == null || data.hits == undefined) {
				zoomablearea.reset();
			} else {
				var hits = data.hits.hits.reverse();
				var diagramData = new Array();
				var hitDate = null;
				var day_i = null;
				// initalize diagramData with value=0 for each hour between minimum and maximum tweets dates
				hitDate = new Date(parseTwitterDate(hits[0].fields.created_at[0]));
				// log("minHit: " + JSON.stringify(hitDate));
				var minDate = new Date(hitDate.getFullYear(), hitDate.getMonth(), hitDate.getDate(), 1);
				// log("minDate: " + JSON.stringify(minDate));
				hitDate = new Date(parseTwitterDate(hits[hits.length - 1].fields.created_at[0]));
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
					hitDate = new Date(parseTwitterDate(hits[i].fields.created_at[0]));
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
			}
		},
    };
    
    // initialize the object 
    Data.init();
    
    return Data;
});


