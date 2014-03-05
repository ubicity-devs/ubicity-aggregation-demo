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
 * @short This package defines the graph for display of wikipedia pages and links
 */

define('wikipedia', function () {

	// internal configuration object
	var config = {

		divElementId : "wikipedia",
		searchFieldId : "search_input",
		wildcardFieldId : "search_wildcard",
		searchButtonId : "search_button",
		
		maxChildren: 10
	};
	
	// variable that represents the data module
	var data = require('data');

	// The Slideshow object
    var Wikipedia = {

    	// ---------------------------------------------------------------------------------------------------

    	/**
    	 * @short Initialize the wikipedia view in the browser. The init()-Function is called in this file, right before the return statement
    	 */
		init : function() {
			$("#wikipedia").empty();
		},
		
		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Retrieve flickr images from server
		 */
		
		searchWikipedia : function() {
			var s = document.getElementById(config.searchFieldId);
			var wildcard = document.getElementById(config.wildcardFieldId);
			var wcChecked = wildcard != undefined && wildcard != null ? wildcard.checked : false;
			if (s.value != undefined && s.value != null && s.value != '') {
				// retrieve flickr objects:
				cursor_wait();
			    data.getWikipedia(s.value.trim(), 
			    		wcChecked, 
			    		function(data) {
							cursor_default();
					    	// add images to wikipedia graph:
					    	Wikipedia.addGraph(data);
					    });
			} else {
				showDialog('Ubicity Tweets', '<br><br>Please enter a search string.', 'warning');
			}
		},

		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Add wikipedia pages and links to the graph
		 */
		addGraph : function(hits) {
			
			var s = document.getElementById(config.searchFieldId);
			var nrOfPages = hits.length;

			$("#wikipedia").empty();
			
			// put data retrieved from ubicity into json structure used by jit RGraph:
			// root node = search string:
			var data = {
					id: s.value,
					name: s.value,
					data: {}
			};
			var children = [];
			// children of root node = all pages found for search string
			for (var n = 0; n < nrOfPages && n < config.maxChildren; n++) {
				var pageContents = hits[n].fields;
				if (pageContents.special[0] == false) {
					var child = {
							id: "node" + n,
							name: pageContents.title[0],
							data: {}
					};
					// children of child node = all links stored in this child object:
					var childrenOfChild = [];
					for (var m = 0; m < pageContents.link.length && m < config.maxChildren; m++) {
						var c = {
								id: "node" + n + m,
								name: pageContents.link[m],
								data: {}
						};
						childrenOfChild.push(c);
					}
					child.children = childrenOfChild;
					children.push(child);
				}
			}	
			data.children = children;
			Wikipedia.drawGraph(data);
		},
		
		// ---------------------------------------------------------------------------------------------------
			
		drawGraph : function(data) {
			var rgraph = new $jit.RGraph({  
			    //Where to append the visualization  
			    injectInto: 'wikipedia',  
			    //Optional: create a background canvas that plots  
			    //concentric circles.  
			    background: {  
			      CanvasStyles: {  
			        strokeStyle: '#555'
			      }  
			    },  
			    //Add navigation capabilities:  
			    //zooming by scrolling and panning.  
			    Navigation: {  
			      enable: false,  
			      panning: false,  
			      zooming: 10  
			    },  
			    //Set Node and Edge styles.  
			    Node: {  
			        // color: '#ddeeff'  
				    color: '#b0becc'  
			    },  
			      
			    Edge: {  
			      color: '#C17878',  
			      lineWidth:1.5  
			    },  
			  
			    onBeforeCompute: function(node){  
			        log("centering " + node.name + "...");  
			        //Add the relation list in the right column.  
			        //This list is taken from the data property of each JSON node.  
			        //$jit.id('inner-details').innerHTML = node.data.relation;  
			    },  
			      
			    //Add the name of the node in the corresponding label  
			    //and a click handler to move the graph.  
			    //This method is called once, on label creation.  
			    onCreateLabel: function(domElement, node){  
			        domElement.innerHTML = node.name;  
			        domElement.onclick = function(){  
			        	var s = document.getElementById(config.searchFieldId);
                		s.value = node.name;
                		var b = document.getElementById(config.searchButtonId);
                		b.click();
			            rgraph.onClick(node.id, {  
			                onComplete: function() {  
			                    log("done");  
			                }  
			            });  
			        };  
			    },  
			    //Change some label dom properties.  
			    //This method is called each time a label is plotted.  
			    onPlaceLabel: function(domElement, node){  
			        var style = domElement.style;  
			        style.display = '';  
			        style.cursor = 'pointer';  
			  
			        if (node._depth <= 1) {  
			            style.fontSize = "0.7em";  
			            style.color = "#a4a4a4";  
			          
			        } else if(node._depth == 2){  
			            style.fontSize = "0.7em";  
			            style.color = "#7f7f7f";  
			          
			        } else {  
			            style.display = 'none';  
			        }  
			  
			        var left = parseInt(style.left);  
			        var w = domElement.offsetWidth;  
			        style.left = (left - w / 2) + 'px';  
			    }  
			});  
			//load JSON data  
			rgraph.loadJSON(data);  
			//trigger small animation  
			rgraph.graph.eachNode(function(n) {  
			  var pos = n.getPos();  
			  pos.setc(-200, -200);  
			});  
			rgraph.compute('end');  
			rgraph.fx.animate({  
			  modes:['polar'],  
			  duration: 2000  
			});  
		}
    };

    // initialize the object 
    Wikipedia.init();
    
   
    return Wikipedia;
});