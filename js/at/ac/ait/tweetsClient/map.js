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
 * @short This package defines basic map interaction routines
 */

var map = null;

define('map', ['leafletCluster', 'leafletDraw', 'data', 'slideshow', 'wikipedia', 'newsticker'], function () {

	// internal configuration object
	var config = {

		divElementId : "map",
		
		searchFieldId : "search_input",
		searchButtonId : "search_button",
		wildcardFieldId : "search_wildcard",
		queryOutputId: "query_output",
			
		center : {
			lon : 15.41123,
			lat : 47.098993
		},
	
		tileUrl : 'http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png',
		
		maxZoom : 18,
		
		initZoom: 5,
		
		maxMarkers: 10000

	};
	
	// variable that represents the data module
	var data = require('data');
	var jQuery = require('jquery');
	var slideshow = require('slideshow');
	var wikipedia = require('wikipedia');
	var newsticker = require('newsticker');
	
	// Map layers:
	var markers = null;
	var bboxLayer = null;
	var drawnItems = null;
	
	// The Map object
    var Map = {

    	// ---------------------------------------------------------------------------------------------------

    	/**
    	 * @short Initialize the map in the browser. The init()-Function is called in this file, right before the return statement
    	 */
		init : function() {
		
			if(map) {
				map.remove();
			}
			
			var osmLayer = new L.TileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { noWrap: true});
			map = new L.Map(config.divElementId,
							{
								layers: [osmLayer], 
								center: new L.latLng([config.center.lat, config.center.lon]), 
								zoom: config.initZoom
							});
			
			drawnItems = new L.FeatureGroup();
			map.addLayer(drawnItems);

			// Initialize the draw control and pass it the FeatureGroup of editable layers
			var drawControl = new L.Control.Draw({
			    draw: {
			        position: 'topleft',
			        rectangle: false,
			        polygon: false,
			        marker: false,
			        polyline: false
			    },
			    edit: false
			});
			map.addControl(drawControl);
			map.on('draw:created', function (e) {
			    var layer = e.layer;

				if (markers != null) {
					map.removeLayer(markers);
					markers = null;
				}
    			log("draw created; e.layerType = " + e.layerType);
			    bboxLayer = layer;
			    drawnItems.addLayer(layer);
			    Map.searchTweets();
				slideshow.searchFlickr();
				wikipedia.searchWikipedia();
				newsticker.showNews(document.getElementById(config.searchFieldId).value);
			});
			
			map.on('draw:drawstart', function (e) {
			    if (bboxLayer != null) {
			        drawnItems.removeLayer(bboxLayer);
			        map.removeLayer(bboxLayer);
			        bboxLayer = null;
			    }
			    
			});

//			map.on('click', Map.onMapClick);
			
			// event handlers for search field and button:
			var s = document.getElementById(config.searchFieldId);
			var supportsHtml5Search = !!('onsearch' in s);
			if (supportsHtml5Search) {
				s.addEventListener('search', function(e) {
					Map.searchTweets();
					slideshow.searchFlickr();
					wikipedia.searchWikipedia();
					newsticker.showNews(s.value);
				}, false);
			} else {
				s.addEventListener('keyup', function(e) {
					if (e.keyCode == 13) {
						Map.searchTweets();
						slideshow.searchFlickr();
						wikipedia.searchWikipedia();
						newsticker.showNews(s.value);
					}
				}, false);
			}
			var b = document.getElementById(config.searchButtonId);
			b.addEventListener('click', function(e) {
				Map.searchTweets();
				slideshow.searchFlickr();
				wikipedia.searchWikipedia();
				newsticker.showNews(s.value);
			}, false);
			
			var qo = document.getElementById(config.queryOutputId);
			qo.innerHTML= "No search query executed";
		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve tweets from server
		 */
		
		searchTweets : function(timeFilter) {
			var location = null;
			var distance = 0;
			
			var qo = document.getElementById(config.queryOutputId);
			qo.innerHTML= "Loading Tweets ...";
			
			if (bboxLayer != null) {
				location = bboxLayer.getLatLng();
				distance = bboxLayer.getRadius()/1000;
			}			
			var s = document.getElementById(config.searchFieldId);
			var wildcard = document.getElementById(config.wildcardFieldId);
			var wcChecked = wildcard != undefined && wildcard != null ? wildcard.checked : false;
			if (s.value != undefined && s.value != null && s.value != '') {
				// collect all tweet objects in one 
				// retrieve tweets:
				cursor_wait();
			    data.getTweets(s.value, 
			    		wcChecked, 
			    		location, 
			    		distance, 
			    		function(data, count) {
							cursor_default();
							var status = {
									count : '0',
									took : '0'
							};
							

							
							if (data == null) {
								if (count == 0) {
									// no tweets found
									showDialog('Ubicity Tweets', '<br><br>There are no tweets matching your search string.', 'warning');
								} else if (count > config.maxMarkers) {
									//alert("Too many search results, please limit search area!");
									status.count = count;
									showDialog('Ubicity Tweets', '<br><br>There are ' + count + ' (max. ' + config.maxMarkers + ') tweets matching your search string.<br><br>Please limit the search area!', 'warning');
								}
							} else {
								count = data.hits.hits.length;
								status.count = count;
								status.took = data.took;
								// add markers to map
								Map.addPoints(data);
							    Map.updateDiagram(data);
							}
							var qo = document.getElementById(config.queryOutputId);
							qo.innerHTML= "Query result: " + status.count + " hits in " + status.took + " milliseconds.";
					    },
					    timeFilter);
			} else {
				showDialog('Ubicity Tweets', '<br><br>Please enter a search string.', 'warning');
			}
		},

		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Add points to the map
		 */
		addPoints : function(rows) {
			if (markers != null) {
				map.removeLayer(markers);
				if (rows == null || rows.hits == undefined) {
					return;
				}
			}
			markers = new L.MarkerClusterGroup({ spiderfyOnMaxZoom: true, showCoverageOnHover: true, zoomToBoundsOnClick: false});
			
			var nrOfPoints = rows.hits.hits.length;
			var array = [];

			for (var i = 0; i < nrOfPoints; i++) {
				var s = rows.hits.hits[i].fields;
				
				if(s.created_at[0] != null && s["place.geo_point"] != null && s["place.geo_point"].length==2) {
					var lat = s["place.geo_point"][1];
					var lon = s["place.geo_point"][0];
					var marker = L.marker(new L.LatLng(lat, lon), { title: "Tweet from " + s["user.name"]});
					var dateStr = s.created_at[0];
					marker.bindPopup('Text: ' + s["msg.text"] + '<br/><br/>Created at: ' + new Date(dateStr));
					array.push(marker);
				}
			}
			markers.addLayers(array);
			markers.on('clusterclick', function(a) {
				var mapObject = require('map');
				mapObject.onMapClick(a);
			});
			map.addLayer(markers);
	
		},
		
		/**
		 * @short Open popup to define circle area for searching
		 */
		onMapClick : function(e) {
			/** Url to Google geocoder to retrieve address from location: */
			if (map.getZoom() > 5) {
				if (bboxLayer != null) {
			        drawnItems.removeLayer(bboxLayer);
			        map.removeLayer(bboxLayer);
			        bboxLayer = null;
			    }
	
				var googleGeocoder = "http://maps.googleapis.com/maps/api/geocode/json?latlng=";
				var url = googleGeocoder + e.latlng.lat + "," + e.latlng.lng + "&sensor=true";
				jQuery.get(url, function(googleData) {
					if (bboxLayer != null) {
	    				map.removeLayer(bboxLayer);
	    			}
					var address = null;
					if (googleData != null && googleData.results != null && googleData.results.length > 0) {
						address = googleData.results[0].formatted_address;
					}
					if (address == null) {
						address = '';
					}
					var lat = e.latlng.lat;
					var lng = e.latlng.lng;
					var offset = new L.Point(0, -50);
				    var popup = L.popup({offset: offset, maxWidth: 500})
				    .setLatLng(e.latlng)
				    .setContent(address + '<br><br>Enter distance (km):' +
				    		'<br><input type="range" id="distRange" name="distance" min="0.5" max="50" step="0.5" value="0" style="width: 80px;"/>' +
				    		'<output id="distOutput">0</output>' +
				    		'<br><br><center><input type="button" id="okBtn" value="Ok" onclick="okClicked(id,' + lat + ',' + lng + ', distRange.value)"/></center>')
				    .openOn(map);
				    var myRange = document.getElementById("distRange");
				    myRange.addEventListener(
				    		'change', 
				    		function() {
				    			var dist = myRange.value;
				    			// draw bboxLayer depending on dist:
				    			document.getElementById("distOutput").innerHTML = dist;
				    			if (bboxLayer != null) {
				    				map.removeLayer(bboxLayer);
				    			}		    			
				    			bboxLayer = L.circle(e.latlng, dist*1000, {
				    				stroke: true,
				    				color: '#f06eaa',
				    				weight: 4,
				    				opacity: 0.5,
				    				fill: true,
				    				fillColor: null, //same as color by default
				    				fillOpacity: 0.2
				    			}).addTo(map);
				    		}, 
				    		false);
				});
			}
		},
				
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Delete points from map
		 */
		deletePoints : function() {
			if (markers != null) {
				map.removeLayer(markers);
				markers = null;
			}
		},
		
		/**
		 * @short Update time scale diagram
		 */
		updateDiagram: function(tweetData) {
			data.updateDiagram(tweetData);		
		},

		// ---------------------------------------------------------------------------------------------------

    };

    // initialize the map 
    Map.init();
    
   
    return Map;
});

/**
 * @short Called when ok button in popup for defining circle range is clicked
 */
function okClicked(btnId, lat, lng, dist) {
	map.closePopup();
	var mapObject = require('map');
	var latlng = {
			lat: lat,
			lng: lng
	};
	mapObject.searchTweets();
};
