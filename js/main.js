require.config({

	// list all available require-objects or JavaScript libraries
    paths:{

        domReady:'com/require/domready',     
        jquery:'com/jquery/jquery.min',       
        leaflet : 'com/leaflet/leaflet',
        d3 : 'com/d3js/d3.v3.min',
        map : 'at/ac/ait/tweetsClient/map',
        zoomablearea : 'at/ac/ait/d3/zoomablearea',
        data: 'at/ac/ait/tweetsClient/data',
        slideshow : 'at/ac/ait/tweetsClient/slideshow',
        wikipedia : 'at/ac/ait/tweetsClient/wikipedia',
        newsticker : 'at/ac/ait/tweetsClient/newsticker',
        leafletCluster: 'com/leaflet/leaflet.cluster',
        leafletDraw: 'com/leaflet/leaflet.draw',
        jit: 'com/jit-yc/jit-yc',
        feedzilla: 'com/feedzilla/widget'
    },

    // define dependencies between libraries
    shim:{
	    leafletDraw: {
	    	deps: ['leaflet']
	    },
	    leafletCluster: {
	    	deps: ['leaflet']
	    },
	    data : {
	    	deps : ['jquery', 'zoomablearea']
	    },
        map : {
        	deps : ['leafletCluster', 'leafletDraw', 'data', 'slideshow', 'wikipedia', 'newsticker', 'jquery']
        },
        slideshow : {
        	deps : ['data', 'jquery']
        },
        wikipedia : {
        	deps : ['data', 'jit', 'jquery']
        },
        newsticker : {
        	deps : ['feedzilla']
        }
    }
});

/**
 * Application execution starts here.
 * 
 * Wait until DOM rendering is complete and all CSS files have been loaded. 
 * Trigger the domReady-Event and execute application logic.
 */
require(['domReady', 'require', 'jquery', 'map', 'd3', 'zoomablearea', 'data', 'slideshow', 'newsticker'], function (domReady, require) {

	domReady(function () {
		
		function onDeviceReady(desktop) {
			
			// start application logic here
			var zoomablearea = require('zoomablearea');

			zoomablearea.init();
}
		   
		if (navigator.userAgent.match(/(iPad|iPhone|Android)/)) {
			// This is running on a device so waiting for deviceready event
			document.addEventListener('deviceready', onDeviceReady, false);
		} else {
			// On desktop don't have to wait for anything
			onDeviceReady(true);
		}
	
	});

});

