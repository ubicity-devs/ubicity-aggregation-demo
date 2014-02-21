/**
 * @author hermann
 * @short This package defines the d3 Zoomable Area Object
 */
define('zoomablearea', ['d3'], function () {

	// internal configuration object
	var config = {
	}

	var m = [10, 50, 50, 10], // top, left, bottom, right
	    w = 700 - m[1] - m[3],
	    h = 450 - m[0] - m[2],
	    format = d3.time.format("%Y");

	var x,y,xAxis,yAxis,area,line,svg,gradient,rect, zm = null;
	
	var dataPerHour = null;
	var dataPer3Hours = null;
	var dataPer6Hours = null;
	var dataPer12Hours = null;
	var dataPerDay = null;
	var zoomlevel = 0;
	    
	// The zoomable area object
    var Zoomablearea = {

    	onClick : function(callback) {
    		config.onclick = callback;
    	},
    	
    	init : function(cfg) {

			// Scales. Note the inverted domain for the y-scale: bigger is up!
			x = d3.time.scale().range([0, w]),
			y = d3.scale.linear().range([h, 0]),
			xAxis = d3.svg.axis().scale(x).orient("bottom").tickSize(-h, 0).tickPadding(2).ticks(6).tickFormat(d3.time.format("%b/%d %H:00")),
			yAxis = d3.svg.axis().scale(y).orient("right").tickSize(-w).tickPadding(6); 

			

			// An area generator.
			 area = d3.svg.area()
			    .interpolate("step-after")
			    .x(function(d) { return x(d.date); })
			    .y0(y(0))
			    .y1(function(d) { return y(d.value); });

			// A line generator.
			 line = d3.svg.line()
			    .interpolate("step-after")
			    .x(function(d) { return x(d.date); })
			    .y(function(d) { return y(d.value); });

			 svg = d3.select("#data").append("svg:svg")
			    .attr("width", w + m[1] + m[3])
			    .attr("height", h + m[0] + m[2])
			  .append("svg:g")
			    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

			 gradient = svg.append("svg:defs").append("svg:linearGradient")
			    .attr("id", "gradient")
			    .attr("x2", "0%")
			    .attr("y2", "100%");

			gradient.append("svg:stop")
			    .attr("offset", "0%")
			    .attr("stop-color", "#fff")
			    .attr("stop-opacity", .5);

			gradient.append("svg:stop")
			    .attr("offset", "100%")
			    .attr("stop-color", "#999")
			    .attr("stop-opacity", 1);

			svg.append("svg:clipPath")
			    .attr("id", "clip")
			  .append("svg:rect")
			    .attr("x", x(0))
			    .attr("y", y(1))
			    .attr("width", x(1) - x(0))
			    .attr("height", y(0) - y(1));

			svg.append("svg:g")
			    .attr("class", "y axis")
			    .attr("id", "yaxis")
			    .attr("transform", "translate(" + w + ",0)");

			svg.append("svg:path")
			    .attr("class", "area")
			    .attr("clip-path", "url(#clip)")
			    .style("fill", "url(#gradient)");

			svg.append("svg:g")
			    .attr("class", "x axis")
			    .attr("id", "xaxis")
			    .attr("transform", "translate(0," + h + ")")
			    .on('click', Zoomablearea.clicked);

			svg.append("svg:path")
			    .attr("class", "line")
			    .attr("clip-path", "url(#clip)");

			rect = svg.append("svg:rect")
			    .attr("class", "pane")
			    .attr("width", w)
			    .attr("height", h);
			
			// text label for the x axis
			svg.append("text") 
		        .attr("x", w/2)
		        .attr("y", h + m[2])
		        .style("text-anchor", "middle")
		        .attr("dy", "-1em")
		        .text("Time");
			
			// text label for the y axis
			svg.append("text")
		        .attr("transform", "rotate(90)")
		        .attr("y", 0 - w - m[3] - 10)
		        .attr("x",0 + (h / 2))
		        .attr("dy", "-2em")
		        .style("text-anchor", "middle")
		        .text("Amount");
			
			// graph title:
			svg.append("text")
		        .attr("x", 0 + m[1])				
		        .attr("y", 0 + m[0])
		        .attr("text-anchor", "left")	
		        .style("font-size", "16px") 
		        .style("font-style", "italic") 
		        .style("fill", "purple") 
		        .style("text-decoration", "underline") 	
		        .text("Tweets per time");
   		
    	},

    	reset : function() {
    		for (var i = 0; i < dataPerHour.length; i++) {
    			dataPerHour[i].value = 0;
    		}
    		for (var i = 0; i < dataPer3Hours.length; i++) {
    			dataPer3Hours[i].value = 0;
    		}
    		for (var i = 0; i < dataPer6Hours.length; i++) {
    			dataPer6Hours[i].value = 0;
    		}
    		for (var i = 0; i < dataPer12Hours.length; i++) {
    			dataPer12Hours[i].value = 0;
    		}
    		for (var i = 0; i < dataPerDay.length; i++) {
    			dataPerDay[i].value = 0;
    		}
    		Zoomablearea.draw(dataPerHour);
    	},
    	
    	initData : function(data) {
    		zoomlevel = 0;
    		dataPerHour = data;
    		dataPer3Hours = Zoomablearea.accumulate(data, 3);
    		dataPer6Hours = Zoomablearea.accumulate(data, 6);
    		dataPer12Hours = Zoomablearea.accumulate(data, 12);
    		dataPerDay = Zoomablearea.accumulate(data, 24);
    		Zoomablearea.draw(dataPerHour);
    	},
    	
    	accumulate : function(data, interval) {
    		retVal = new Array();
    		for (var i = 0; i < data.length; i+=interval) {
    			var sum = 0;
    			for (var j = i; j < i+interval; j++) {
    				if (data[j] != undefined) {
    					sum += data[j].value;
    				}
    			}
    			var day = data[i].date;
    			if (interval == 24) {
    				day = data[i].date.setHours(1);
    			}
    			retVal.push({date: day, value: sum});
    		}
    		return retVal;
    	},
    	
    	draw : function(data) {
			  // Specify the x and y scales shown initially on the screen.
			  var maxDate = new Date(data[data.length-1].date);
			  maxDate.setDate(maxDate.getDate() + 1);
			  var minDate = new Date(maxDate);
			  minDate.setDate(maxDate.getDate() - 7);
			  x.domain([minDate, maxDate]);
			  // Call the redraw function on zoom events
			  rect.call(zm = d3.behavior.zoom().x(x).scaleExtent([0.5, 24]).on("zoom", Zoomablearea._redraw));

			  Zoomablearea._redraw();

    	},

    	 _redraw : function() {
    		 var currentlevel = Math.round(zm.scale());
    		 if (zoomlevel != currentlevel) {
    			 zoomlevel = currentlevel;
	    		 var data = dataPerDay;
	    		 if (currentlevel > 1 && currentlevel <= 3) {
	    			 data = dataPer12Hours;
	    		 } else if (currentlevel > 3 && currentlevel <= 5) {
	    			 data = dataPer6Hours;
	    		 } else if (currentlevel > 5 && currentlevel <= 16) {
	    			 data = dataPer3Hours;
	    		 } else if (currentlevel > 16 && currentlevel <= 24) {
	    			 data = dataPerHour;
	    		 }
				  // Redefine the y scale.
	    		 var max_y = d3.max(data, function(d) { return d.value; });
				  y.domain([0,  max_y + max_y/6]);
	
				  // Bind the data to our path elements.
				  svg.select("path.area").data([data]);
				  svg.select("path.line").data([data]);
				  
    		 }
    		 svg.select("g.x.axis").call(xAxis);
			 svg.select("g.y.axis").call(yAxis);
			 svg.select("path.area").attr("d", area);
			 svg.select("path.line").attr("d", line);
    	},

    	clicked : function(d) {
    		var xPos = d3.mouse(this)[0];
            var ticks = x.ticks(6);
            var leftEdge = x(ticks[0]);
            var width = x(ticks[ticks.length - 1]) - x(ticks[ticks.length - 2]);
            var j;
            for(j=0; xPos > (leftEdge + (width*j) - (width/2)); j++) {}
                //do nothing, just increment j until case fails
            var timeFilter = {};
            var timeFormat = d3.time.format('%a %b %d %H:00:00 %Z %Y');
            timeFilter.from = timeFormat(ticks[j-1]);
            timeFilter.to = timeFormat(ticks[j]);
            if (config.onclick != undefined) {
            	config.onclick(timeFilter);
            }
    	},
    	
		// ---------------------------------------------------------------------------------------------------

    };
    return Zoomablearea;
});
