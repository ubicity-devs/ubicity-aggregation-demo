/**
 * global feedzilla namespace
 */
if (typeof window.FEEDZILLA == 'undefined') 
    window.FEEDZILLA = new Object();


/**
 * creates a new widget iframe right after the current script node
 * @param {Object} options the widget options as an object
 */
FEEDZILLA.Widget = function(options){
    try {
        init();
    } 
    catch (error) {
        if (typeof console != "undefined" && typeof console.log != "undefined") 
            console.log(error);
    }
    
    
    // initializes it all
    function init(){
        FEEDZILLA.doneClassName = "feedzilla-done";
        
        sanitizeOptions();
        
        var targetNodes = getTargetNodes();
        
        if (targetNodes != null) {
            var baseUrl = getBaseUrl(targetNodes[0]);
            
            if (options["style"] == "ticker") 
                FEEDZILLA.iframeSrc = "http://widgets.feedzilla.com/news/iframe/ticker.html";
            else 
                FEEDZILLA.iframeSrc = "http://widgets.feedzilla.com/news/iframe/index.html";
            
            for (var i = 0; i < targetNodes.length; i++) {
            	removeIframe(targetNodes[i]);
				appendIframe(targetNodes[i]);
			}
        }
        
    }
    
    
    /**
     * returns the dom node of this script, null if nothing was found
     */
    function getTargetNodes(){
        // find the div according to the class name
        return getElementsByClassName(options["className"]);
    };
    
    
    /**
     * gets elements according to class name
     * @param {Object} classname
     */
    function getElementsByClassName(classname){
        var rootNode = document.getElementsByTagName("body")[0];
        var nodes = [];
        var re = new RegExp('\\b' + classname + '\\b');
        var re2 = new RegExp('\\b' + FEEDZILLA.doneClassName + '\\b');
        var els = rootNode.getElementsByTagName("div");
        for (var i = 0, j = els.length; i < j; i++) 
            if (re.test(els[i].className) && !re2.test(els[i].className)) 
                nodes.push(els[i]);
        
        return nodes;
    }
    
    
    /**
     * takes care of removing evil stuff from the options and setting defaults if necessary
     */
    function sanitizeOptions(){
        // set width and height to defaults if they are not numbers
        if (!isNumeric(options["w"])) 
            options["w"] = "250";
        if (!isNumeric(options["h"])) 
            options["h"] = "300";
        
		// convert tab options to simple format
		if (options["tabs"]) {
			// create c1, sc1, tabName1, etc.
			for(var i = 0; i < options["tabs"].length; i++) {
				var tab = options["tabs"][i];
				var index = i + 1;
				options["c" + index] = tab["c"];
				options["sc" + index] = tab["sc"];
				options["tabName" + index] = tab["name"];
			}
			
			// get rid of the original tabs object and replace it with 'true'
			options["tabs"] = "true";
		}
		
        // go over all options
        for (key in options) {
            var value = options[key];
            
            // truncate parameters
            value = value.substr(0, 250);
            
            // remove evil chars
            var regexp = /<|>|;/g;
            value = value.replace(regexp, "");
            
            options[key] = value;
            
        }
        
    }
    
    
    /**
     * adds the feedzilla iframe right after the given node
     * @param {Object} node the dom node before which the iframe will be added
     */
    function appendIframe(node){
        // mark the widget div as done
//        node.className = node.className + " " + FEEDZILLA.doneClassName;
        
        // prepare the querystring
        var querystring = getQuerystring();
        
        // create the iframe code, slightly increased height
        var iframe = document.createElement("iframe");
        iframe.width = options["w"];
        // add 10 pixels to iframe height due to jquery theme variations
        iframe.height = parseInt(options["h"]);
        iframe.scrolling = "no";
        iframe.marginWidth = 0;
        iframe.marginHeight = 0;
        iframe.frameBorder = 0;
        iframe.style.borderWidth = 0;
        iframe.src = "about:blank";
		iframe.allowTransparency = true;
		
        // finally, insert the iframe, handle ticker and non-ticker styles with/out link
        if (node.childNodes.length > 0) {
			node.insertBefore(iframe, node.childNodes[0]);
		}
		else {
			node.appendChild(iframe);
		}
        
		iframe.contentWindow.location = FEEDZILLA.iframeSrc + "?" + querystring;
    };
    
    function removeIframe(node){
    	while (node.firstChild) {
    		node.removeChild(node.firstChild);
    	}
    }   
    
    /**
     * creates the querystring according to the options
     */
    function getQuerystring(){
        var querystring = "";
        
        // add referrer + startDate to the options
        options["referrer"] = document.location;
		
        // create the iframe querystring
        for (property in options) {
            var value = options[property];
            querystring = querystring + encode(property) + "=" + encode(value) + "&";
        }
        
        // remove last ampersand
        querystring = querystring.substr(0, querystring.length - 1);
        
        return querystring;
    };
    
    
    /**
     * helper function that url encodes a string with the best function available
     * @param {Object} str
     */
    function encode(str){
        var encode = typeof encodeURIComponent != 'undefined' ? encodeURIComponent : escape;
        
        return encode(str);
    };
    
    
    /**
     * helper function,
     * @param {Object} input
     */
    function isNumeric(input){
        var RE = /^-{0,1}\d*\.{0,1}\d+$/;
        return (RE.test(input));
    }
    
    
    /**
     * helper function to get the base url for the widget
     * @param {Object} node the div node within the widget lies
     */
    function getBaseUrl(node){
        var baseUrl, src, scripts;
        
		// first, try to look for the script within the widget div
        scripts = node.getElementsByTagName("script");
		src = getScriptSrc(scripts);
		
		// didn't find src - search in all script tags - this is the case for the builder
		if (src == "") {
			scripts = document.getElementsByTagName("script");
			src = getScriptSrc(scripts);
		}
		
		baseUrl = src.replace("/js/widget.js", "");
		
        return baseUrl;
		
		
		function getScriptSrc(scripts) {
			var src = "";
			
	        // go over the scripts in the right order, first right match breaks the loop
	        for (var i = 0; i < scripts.length; i++) {
	            // look for the widget.js script
	            src = scripts[i].src
	            if (src && /widget.js/.test(src)) {
	                break;
	            }
	        }
			
			return src;
		}
    }
    
    
}