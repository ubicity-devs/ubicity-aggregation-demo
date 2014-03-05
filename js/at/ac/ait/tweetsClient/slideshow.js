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
 * @short This package defines the slideshow for flickr images
 */

define('slideshow', function () {

	// internal configuration object
	var config = {

		divElementId : "slideshow",
		searchFieldId : "search_input",
		wildcardFieldId : "search_wildcard"
	};
	
	// variable that represents the data module
	var data = require('data');

	// The Slideshow object
    var Slideshow = {

    	// ---------------------------------------------------------------------------------------------------

    	/**
    	 * @short Initialize the slideshow in the browser. The init()-Function is called in this file, right before the return statement
    	 */
		init : function() {
		
			setInterval(function () {
			    $('#slideshow > div:first')
			        .fadeOut(1000)
			        .next()
			        .fadeIn(1000)
			        .end()
			        .appendTo('#slideshow');
			}, 3000);
		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve flickr images from server
		 */
		
		searchFlickr : function() {
			var s = document.getElementById(config.searchFieldId);
			var wildcard = document.getElementById(config.wildcardFieldId);
			var wcChecked = wildcard != undefined && wildcard != null ? wildcard.checked : false;
			if (s.value != undefined && s.value != null && s.value != '') {
				// retrieve flickr objects:
				cursor_wait();
			    data.getFlickrImages(s.value.trim(), 
			    		wcChecked, 
			    		function(data) {
							cursor_default();
					    	// add images to slideshow:
					    	Slideshow.addImages(data);
					    });
			} else {
				showDialog('Ubicity Tweets', '<br><br>Please enter a search string.', 'warning');
			}
		},

		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Add images to the photoViewer
		 */
		addImages : function(rows) {
			
			var s = document.getElementById(config.divElementId);
			var nrOfImages = rows.length;

			Slideshow.reset();
			
			for (var n = 0; n < nrOfImages; n++) {
				// check for image redirect:
				var div = document.createElement('div');
				var a = new Image();
				a.src = rows[n];
				div.appendChild(a);
				s.appendChild(div);
			}
			$("#slideshow > div:gt(0)").hide();

		},
		
		/**
		 * @short Reset slideshow
		 */
		reset : function() {
			$("#slideshow").empty();
		}
		
		// ---------------------------------------------------------------------------------------------------

    };

    // initialize the widget 
    Slideshow.init();
    
   
    return Slideshow;
});