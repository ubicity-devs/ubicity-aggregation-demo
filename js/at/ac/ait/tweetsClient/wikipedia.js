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
    	 * @short Initialize the slideshow in the browser. The init()-Function is called in this file, right before the return statement
    	 */
		init : function() {
		
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
			    data.getWikipedia(s.value, 
			    		wcChecked, 
			    		function(data) {
							cursor_default();
					    	// add images to slideshow:
					    	Wikipedia.addGraph(data);
					    });
			} else {
				showDialog('Ubicity Tweets', '<br><br>Please enter a search string.', 'warning');
			}
		},

		// ---------------------------------------------------------------------------------------------------
		
		/**
		 * @short Add images to the photoViewer
		 */
		addGraph : function(rows) {
			
			var s = document.getElementById(config.searchFieldId);
			var nrOfPages = rows.hits.hits.length;

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
				if (rows.hits.hits[n].fields.special == false) {
					var child = {
							id: "node" + n,
							name: rows.hits.hits[n].fields.title,
							data: {}
					};
					// children of child node = all links stored in this child object:
					var childrenOfChild = [];
					for (var m = 0; m < rows.hits.hits[n].fields.link.length && m < config.maxChildren; m++) {
						var c = {
								id: "node" + n + m,
								name: rows.hits.hits[n].fields.link[m],
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
			      enable: true,  
			      panning: true,  
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
/*			
			
			
			
			
			
			//Create a new ST instance  
			var st = new $jit.ST({  
			    //id of viz container element  
			    injectInto: 'wikipedia',  
			    //set duration for the animation  
			    duration: 800,  
			    //set animation transition type  
			    transition: $jit.Trans.Quart.easeInOut,  
			    //set distance between node and its children  
			    levelDistance: 50,  
			    //enable panning  
			    Navigation: {  
			      enable:true,  
			      panning:true  
			    },  
			    //set node and edge styles  
			    //set overridable=true for styling individual  
			    //nodes or edges  
			    Node: {  
			        height: 50,  
			        width: 100,  
			        type: 'rectangle',  
			        color: '#aaa',  
			        overridable: true  
			    },  
			      
			    Edge: {  
			        type: 'bezier',  
			        overridable: true  
			    },  
			      
//               Events : { 
//                    enable : true, 
//                    type : 'Native', 
//                    onClick : function(node, eventInfo, e) {
//	                    	//if no node is returned then exit
//	                        if (!node) return;
//                            if (node.nodeFrom) { 
//                                    // it's an edge 
//                            } else { 
//                                    // it's a node 
//                            		var s = document.getElementById(config.searchFieldId);
//                            		s.value = node.name;
//                                    rgraph.onClick(node.id); 
//                            } 
//                    } 
//                }, 
//
	            onBeforeCompute: function(node){  
			        log("loading " + node.name);  
			    },  
			      
			    onAfterCompute: function(){  
			        log("done");  
			    },  
			      
			    //This method is called on DOM label creation.  
			    //Use this method to add event handlers and styles to  
			    //your node.  
			    onCreateLabel: function(label, node){  
			        label.id = node.id;              
			        label.innerHTML = node.name;  
			        label.onclick = function(){  
			        	var s = document.getElementById(config.searchFieldId);
                		s.value = node.name;
                		st.onClick(node.id);  
			        };  
			        //set label styles  
			        var style = label.style;  
			        style.width = 100 + 'px';  
			        style.height = 50 + 'px';              
			        style.cursor = 'pointer';  
			        style.color = '#333';  
			        style.fontSize = '0.8em';  
			        style.textAlign= 'left';  
			        style.paddingTop = '3px';  
			    },  
			      
			    //This method is called right before plotting  
			    //a node. It's useful for changing an individual node  
			    //style properties before plotting it.  
			    //The data properties prefixed with a dollar  
			    //sign will override the global node style properties.  
			    onBeforePlotNode: function(node){  
			        //add some color to the nodes in the path between the  
			        //root node and the selected node.  
			        if (node.selected) {  
			            node.data.$color = "#ff7";  
			        }  
			        else {  
			            delete node.data.$color;  
			            //if the node belongs to the last plotted level  
			            if(!node.anySubnode("exist")) {  
			                //count children number  
			                var count = 0;  
			                node.eachSubnode(function(n) { count++; });  
			                //assign a node color based on  
			                //how many children it has  
			                node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];                      
			            }  
			        }  
			    },  
			      
			    //This method is called right before plotting  
			    //an edge. It's useful for changing an individual edge  
			    //style properties before plotting it.  
			    //Edge data proprties prefixed with a dollar sign will  
			    //override the Edge global style properties.  
			    onBeforePlotLine: function(adj){  
			        if (adj.nodeFrom.selected && adj.nodeTo.selected) {  
			            adj.data.$color = "#eed";  
			            adj.data.$lineWidth = 3;  
			        }  
			        else {  
			            delete adj.data.$color;  
			            delete adj.data.$lineWidth;  
			        }  
			    }  
			});  
			//load json data  
			st.loadJSON(data);  
			//compute node positions and layout  
			st.compute();  
			//optional: make a translation of the tree  
			st.geom.translate(new $jit.Complex(-200, 0), "current");  
			//emulate a click on the root node.  
			st.onClick(st.root);  
		    //end
*/		}
    };

    // initialize the object 
    Wikipedia.init();
    
   
    return Wikipedia;
});