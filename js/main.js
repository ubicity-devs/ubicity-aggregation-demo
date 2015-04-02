/**
 * Copyright (C) 2014 AIT / Austrian Institute of Technology
 * http://www.ait.ac.at
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see
 * http://www.gnu.org/licenses/agpl-3.0.html
 */

require.config({

    // list all available require-objects or JavaScript libraries
    paths : {

	domReady : 'com/require/domready',
	jquery : 'com/jquery/jquery.min',
	leaflet : 'com/leaflet/leaflet',
	d3 : 'com/d3js/d3.v3.min',
	c3 : 'com/c3js/c3.min',
	map : 'at/ac/ait/tweetsClient/map',
	data : 'at/ac/ait/tweetsClient/data',
	slideshow : 'at/ac/ait/tweetsClient/slideshow',
	twitterchart : 'at/ac/ait/tweetsClient/twitterchart',
	wikipedia : 'at/ac/ait/tweetsClient/wikipedia',
	newsticker : 'at/ac/ait/tweetsClient/newsticker',
	leafletCluster : 'com/leaflet/leaflet.cluster',
	leafletDraw : 'com/leaflet/leaflet.draw',
	jit : 'com/jit-yc/jit-yc',
	feedzilla : 'com/feedzilla/widget',
	elasticsearch : 'com/elasticsearch/elasticsearch.min',
    },

    // define dependencies between libraries
    shim : {
	leafletDraw : {
	    deps : [ 'leaflet' ]
	},
	leafletCluster : {
	    deps : [ 'leaflet' ]
	},
	data : {
	    deps : [ 'jquery' ]
	},
	map : {
	    deps : [ 'leafletCluster', 'leafletDraw', 'data', 'slideshow', 'wikipedia', 'newsticker', 'jquery', 'twitterchart' ]
	},
	slideshow : {
	    deps : [ 'data', 'jquery' ]
	},
	twitterchart : {
	    deps : [ 'c3', 'd3' ]
	},
	wikipedia : {
	    deps : [ 'data', 'jit', 'jquery' ]
	},
	newsticker : {
	    deps : [ 'feedzilla' ]
	}
    }
});

/**
 * Application execution starts here.
 * 
 * Wait until DOM rendering is complete and all CSS files have been loaded.
 * Trigger the domReady-Event and execute application logic.
 */
require([ 'domReady', 'require', 'jquery', 'map', 'data', 'slideshow', 'newsticker', 'twitterchart' ], function(domReady, require) {

    domReady(function() {

	function onDeviceReady(desktop) {
	    setDateSearchFields();
	}

	if (navigator.userAgent.match(/(iPad|iPhone|Android)/)) {
	    // This is running on a device so waiting for
	    // deviceready event
	    document.addEventListener('deviceready', onDeviceReady, false);
	} else {
	    // On desktop don't have to wait for anything
	    onDeviceReady(true);
	}
    });

    function setDateSearchFields() {
	var d = new Date();
	var day = formatter(d.getDate()) + "." + formatter(d.getMonth() + 1) + "." + d.getFullYear();

	$('#date_from').val(day + " 00:00");
	$('#date_to').val(day + " " + formatter(d.getHours()) + ":" + formatter(d.getMinutes()));
    }
    ;

    function formatter(num) {
	if (num < 10)
	    return "0" + num;
	else
	    return num;
    };
});
