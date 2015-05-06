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
define('data', [ 'jquery', 'elasticsearch' ], function() {

    // internal configuration object
    var config = {
	esUrl : 'http://ubicity.ait.ac.at:8080/es/',
	twitter : {
	    index : 'twitter_all_geo',
	    type : 'ctweet'
	},
	wikipedia : {
	    index : 'wikipedia',
	    type : 'page'
	},
	flickr : {
	    url : 'http://ubicity.ait.ac.at:8080/rest/command/ubicity-flickr?cmd=index&data=',
	    index : 'flickr',
	    type : ''
	},
	maxQueryResults : 100000,
	demoSize : 100000,
    };

    var jQuery = require('jquery');
    var ejs = require('elasticsearch');
    var twitterchart = require('twitterchart');

    var esClient = null;

    // The Data object
    var Data = {

	// ---------------------------------------------------------------------------------------------------

	/**
	 * @short Initialize the data object. The init()-Function is called in
	 *        this file, right before the return statement
	 */
	init : function() {
	    /* setup client */
	    esClient = new ejs.Client({
		host : config.esUrl,
		log : 'debug'
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
		    must = [ {
			'wildcard' : {
			    'ctweet.msg.text' : filterString
			}
		    } ];
		} else {
		    var a = filterString.split(' ');
		    for (var i = 0; i < a.length; i++) {
			if (a[i] != undefined && a[i] != null && a[i] != '') {
			    must.push({
				'term' : {
				    'ctweet.msg.text' : a[i].trim().toLowerCase()
				}
			    });
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
		    // "boost" : 2.0
		    }
		};
		var range = {
		    'range' : timeQuery
		};
		must.push(range);
	    }
	    query = {
		'query' : {
		    'bool' : {
			'must' : must
		    }
		}
	    };

	    var fields = [ 'place.geo_point', 'created_at', 'msg.text', 'user.name' ];
	    var sort = [ {
		'created_at' : {
		    'order' : 'desc'
		}
	    } ];

	    if (location != null && distance != 0) { // filtered query by
		// geographical area
		var filteredQuery = {
		    'query' : {},
		};
		filteredQuery.query.filtered = query;
		filteredQuery.query.filtered.filter = {
		    'geo_distance' : {
			'distance' : distance + "km",
			'place.geo_point' : {
			    'lat' : location.lat,
			    'lon' : location.lng
			},
			'distance_type' : 'arc'
		    }
		};
		// first get amount of tweets matching the search query:
		log("FilteredQuery: " + JSON.stringify(filteredQuery));
		esClient.count({
		    index : calculateDailyIndex(config.twitter.index),
		    type : config.twitter.type,
		    body : filteredQuery
		}, function(error, resp, status) {
		    if (error || resp == null) {
			log(JSON.stringify(error));
			showDialog('Ubicity Demo', 'Error when calling Twitter index!\n' + error + '\n' + status + '\n', 'error');
		    } else {
			log('Found ' + resp.count + ' twitter entries.');

			if (resp.count == 0 || resp.count > config.maxQueryResults) {
			    callback(null, resp.count);
			} else {
			    filteredQuery.size = resp.count;
			    filteredQuery.fields = fields;
			    filteredQuery.sort = sort;
			    log("FilteredQuery: " + JSON.stringify(filteredQuery));
			    esClient.search({
				index : calculateDailyIndex(config.twitter.index),
				type : config.twitter.type,
				body : filteredQuery
			    }).then(function(resp) {
				if (resp == null) {
				    cursor_default();
				    showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
				} else {
				    log("Search Query:");
				    log("Count: " + resp.hits.total);
				    log("Time: " + resp.took);
				    callback(resp);
				}
			    }, function(error) {
				log('Error in search call for Twitter index: ' + error.message);
				cursor_default();
				showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
			    });
			}
		    }
		});
	    } else { // query not filtered by geographical area nor by time
		// first get amount of tweets matching the search query:
		esClient.count({
		    index : calculateDailyIndex(config.twitter.index),
		    type : config.twitter.type,
		    body : query
		}, function(error, resp, status) {
		    if (error || resp == null) {
			log(JSON.stringify(error));
			cursor_default();
			showDialog('Ubicity Demo', 'Error when calling Twitter index!\n' + error + '\n' + status + '\n', 'error');
		    } else {
			if (resp.count == 0 || resp.count > config.maxQueryResults) {
			    callback(null, resp.count);
			} else {
			    query.fields = fields;
			    query.sort = sort;
			    var size = resp.count;
			    // For demo reasons (-> performance) we limit
			    // size!!!
			    var size = config.demoSize;
			    query.size = size;
			    log("Twitter Query: " + JSON.stringify(query));
			    esClient.search({
				index : calculateDailyIndex(config.twitter.index),
				type : config.twitter.type,
				body : query
			    }).then(function(resp) {
				if (resp == null) {
				    cursor_default();
				    showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
				} else {
				    log("Twitter Search Query:");
				    log("Twitter Count: " + resp.hits.total);
				    log("Twitter Time: " + resp.took);
				    callback(resp);
				}
			    }, function(error) {
				log('Error in search call for twitter index: ' + error.message);
				cursor_default();
				showDialog('Ubicity Demo', 'Error when calling Twitter index!\n', 'error');
			    });
			}
		    }
		});
	    }

	},

	// ---------------------------------------------------------------------------------------------------

	/**
	 * @short Retrieve Flickr images filtered by a text string from ubicity
	 */
	getFlickrImages : function(filterString, wildcard, callback) {

	    // create new es index for filterString on server
	    var url = config.flickr.url + filterString;
	    
	    jQuery.get(url, '', function(data) {
		log(data);
		
		var query = {
		    'query' : {
			'bool' : {
			    'must' : [ {
				match_all : {}
			    } ]
			}
		    },
		    size : 20
		};
		var filterWithoutSpaces = filterString.replace(/\s+/g, "").toLowerCase();
		(function loopsiloop() {
		    setTimeout(function() {
			log("Flickr Query: " + JSON.stringify(query));
			esClient.search({
			    index : config.flickr.index,
			    type : filterWithoutSpaces,
			    body : query
			}).then(function(resp) {
			    if (resp == null) {
				cursor_default();
				showDialog('Ubicity Demo', 'Error when calling Flickr index! (resp=null)\n', 'error');
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
			}, function(error) {
			    log('Error in search call for Flickr index: ' + error.message);
			    cursor_default();
			    showDialog('Ubicity Demo', 'Error when calling Flickr index!\n', 'error');
			})
		    }, 1000);
		})();
	    }).fail(function(xhr, status, errorThrown) {
		showDialog('Ubicity Demo', 'Error when indexing Flickr content!\n' + errorThrown + '\n' + status + '\n' + xhr.statusText, 'error');
	    });
	},

	// ---------------------------------------------------------------------------------------------------

	/**
	 * @short Retrieve Wikipedia pages and links filtered by a text string
	 *        from ubicity
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
			must.push({
			    'term' : {
				'title' : a[i].trim().toLowerCase()
			    }
			});
		    }
		}
	    }
	    query = {
		'query' : {
		    'bool' : {
			'must' : must
		    }
		}
	    };
	    log("Wikipedia Count Query: " + JSON.stringify(query));
	    esClient.count({
		index : config.wikipedia.index,
		type : config.wikipedia.type,
		body : query
	    }, function(error, resp, status) {
		if (error || resp == null) {
		    log(JSON.stringify(error));
		    Data.deleteWikipediaGraph();
		    showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n' + error + '\n' + status + '\n', 'error');
		} else {
		    if (resp.count == 0) {
			Data.deleteWikipediaGraph();
			cursor_default();
			showDialog('Ubicity Demo', '<br><br>There are no wikipedia pages matching your search string.', 'warning');
		    } else {
			var fields = [ 'title', 'link', 'special' ];
			query.fields = fields;
			log("Wikipedia Query: " + JSON.stringify(query));
			esClient.search({
			    index : config.wikipedia.index,
			    type : config.wikipedia.type,
			    body : query
			}).then(function(resp) {
			    if (resp == null) {
				cursor_default();
				showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n', 'error');
			    } else {
				callback(resp.hits.hits);
			    }
			}, function(error) {
			    log('Error in search call for Wikipedia index: ' + error.message);
			    cursor_default();
			    showDialog('Ubicity Demo', 'Error when calling Wikipedia index!\n', 'error');
			});
		    }
		}
	    });
	},

	deleteWikipediaGraph : function() {
	    $("#wikipedia").empty();
	},

	// ---------------------------------------------------------------------------------------------------

	/**
	 * @short Redraw the d3 time scale diagram
	 */
	updateDiagram : function(data) {

	    var now = new moment();
	    var n = new moment();

	    // update d3 diagram:
	    if (data == null || data.hits == undefined) {
		twitterchart.init();
	    } else {
		var hits = data.hits.hits.reverse();

		var cLabel = new Array();
		var cData = new Array();

		for (var h = 0; h <= now.hour() + 1; h++) {

		    for (var m = 0; m < 60; m++) {
			n.millisecond(0);
			n.second(0);
			n.minute(m);
			n.hour(h);
			cLabel[h * 60 + m] = n.valueOf();
			cData[h * 60 + m] = 0;
		    }
		}

		for (var i = 0; i < hits.length; i++) {
		    hitDate = new Date(hits[i].fields.created_at[0]);

		    var idx = hitDate.getHours() * 60 + hitDate.getMinutes();

		    if (idx < cData.length) {
			cData[idx] = cData[idx] + 1;
		    } else {
			console.warn("Index [" + idx + "] out of bounds of cData");
		    }

		}

		twitterchart.initData(cLabel, cData);
	    }
	},
    };

    // initialize the object
    Data.init();
    return Data;
});
