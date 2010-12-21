
var port = location.href.substring( location.href.substring(7).indexOf(':')+8,
			location.href.substring(7).indexOf('/')+7);

// Returns an ajax object
function ajaxConnect() {
	var http = null;		
	if(window.XMLHttpRequest)
		http = new XMLHttpRequest();
        else if (window.ActiveXObject)
	        http = new ActiveXObject("Microsoft.XMLHTTP");	
	return http;
}

/* returns a function that can be passed to http.send
 * that runs code fn on successful response
 *   http:  ajac object
 *   fn: function taking one argument, the response string
 *       run if successful connection  
 *   err: OPTIONAL argument that contains a funtion
 *      to be run if the connection failed
 */
function returnfn(http, fn, err) {
	if (!fn) 
		fn = function(resp) {};
	if (!err) 
		err = function() {};
	return function() {
		if (http.readyState == 4) {
			if (http.responseText == '') 
				err();
			else
				fn(http.responseText);
		} 
	};
}

// Does ajax magic.  Makes ajax call with data and sets up
//  retfn to be called on response
function ajaxSend(http, data, retfn, forward) {
	if (!forward)
		forward = '';
	http.onreadystatechange = retfn;
	http.open('POST', "http://localhost:"+port+"/"+ forward, true);
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	http.send(data);
}
