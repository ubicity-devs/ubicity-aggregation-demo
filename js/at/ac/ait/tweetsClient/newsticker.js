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
 * @short This package defines the feedzilla news ticker
 */

define('newsticker', function() {

    // internal configuration object
    var config = {

	divElementId : "newsticker",

    };

    // The Slideshow object
    var NewsTicker = {

	// ---------------------------------------------------------------------------------------------------

	/**
	 * @short Initialize the newsticker in the browser. The init()-Function
	 *        is called in this file, right before the return statement
	 */
	init : function() {
	    NewsTicker.showNews('');
	},

	showNews : function(filterString) {
	    new FEEDZILLA.Widget({
		style : 'ticker',
		culture_code : 'en_all',
		title : filterString.trim(),
		order : 'relevance',
		count : '20',
		w : '600',
		h : '30',
		timestamp : 'true',
		scrollbar : 'false',
		theme : 'start',
		className : 'feedzilla-3862288056407124',
		q : filterString.trim()
	    });
	}
    };

    // initialize the widget
    NewsTicker.init();

    return NewsTicker;
});