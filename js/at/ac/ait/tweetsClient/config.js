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

var c = {};



function log(msg, origin) {
	if(origin) {
		console.log("[ "+origin.toUpperCase()+" ] " + msg);
	} else {
		console.log("[ LOG ] " + msg);
	}
}

function warn(msg, origin) {
	if(origin) {
		console.log("!! [ "+origin.toUpperCase()+" ] " + msg);
	} else {
		console.log("!! [ WRN ] " + msg);
	}
}

function error(msg, origin) {
	if(origin) {
		console.log("!! [ "+origin.toUpperCase()+" ] " + msg);
	} else {
		console.error("!! [ ERR ] " + msg);
	}
}

function dump(variable, msg) {
	if(msg) {
		console.log("[ DUM ] " + msg + ": " + JSON.stringify(variable));
	} else {
		console.log("[ DUM ] " + JSON.stringify(variable));
	}
}

function cursor_wait() {
//    document.body.style.cursor = 'wait';
    var all = document.getElementsByTagName('*');
    for (var i = -1, l = all.length; ++i < l;) {
        (all[i]).style.cursor = 'wait';
    }
}

function cursor_default() {
 //   document.body.style.cursor = 'default';
    var all = document.getElementsByTagName('*');
    for (var i = -1, l = all.length; ++i < l;) {
        (all[i]).style.cursor = '';
    }
}
    
function parseTwitterDate(str) {
	var v=str.split(' ');
	// log("Timezone: " + v[4]);
	var date = new Date(Date.parse(v[1]+" "+v[2]+", "+v[5]+" "+v[3])).toJSON();
	return date;
}

