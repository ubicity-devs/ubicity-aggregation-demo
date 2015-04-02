define('twitterchart', function() {
    var c3 = require('c3');

    var Twitterchart = {
	init : function() {
	    Twitterchart.initData([], []);
	},
	initData : function(label, data) {

	    var lab = [ 'x' ];
	    lab = lab.concat(label);

	    var dat = [ 'Tweet frequency' ];
	    dat = dat.concat(data);

	    c3.generate({
		size : {
		    height : 450
		},
		bindto : '#twitterChart',
		data : {
		    x : 'x',
		    columns : [ lab, dat ],
		    type : 'bar'
		},
		axis : {
		    x : {
			type : 'timeseries',
			tick : {
			    count : 24,
			    fit : true,
			    format : "%H:%M"
			}
		    }
		},
		bar : {
		    width : {
			ratio : 0.5
		    }
		},
		zoom : {
		    enabled : true
		}
	    });
	}
    };

    // initialize the object
    Twitterchart.init();

    return Twitterchart;
});