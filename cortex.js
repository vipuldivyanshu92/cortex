/* cortex.js
 * PURPOSE
 * AUTHOR
 * LICENSE
 *
 * NOTES
 */
 
 /* HTML elements used
  * cortexLog - textarea
  * statusLabel - div
  * numberOfNodes - div
  * connections -div
  * dlc	- div
  */
 
 /***** Ajax Basics *****/
  
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
 * Kind of a macro function builder
 *   http:  ajax object
 *   fn: function taking one argument, the resp from the server,
 *         this function is run on a successful ajax call  
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

/* Does ajax magic.  Makes ajax call with data and sets up
 *  retfn to be called on response
 * forward is the final destination address of the call if
 * it is not this local
 */
function ajaxSend(http, data, retfn, forward) {
	if (!forward)
		forward = '';
	http.onreadystatechange = retfn;
	http.open('POST', "http://localhost:"+port+"/"+ forward, true);
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	http.send(data);
}

/***** Utility Functions *****/



// make sure a number is two digits long, padding 0 on front
function d2(str) {
	if (str <10)
		return "0"+str;
	else
		return str;
}

// generate the time as a string
function getTime() {
	var date = new Date();
	return d2(date.getHours()) + ":" + d2(date.getMinutes()) + ":" + d2(date.getSeconds())
}

function extractHost(url) {
	//  http: or file:
	var host = url.substr(5);
	while (host.charAt(0) == '/')
		host = host.substr(1);
	var end = host.indexOf('/');
	
	if (end > 0 ) 
		host = host.substr(0, end);
	return host;

}

var logging = true

function log(str) {
	//if (logCheckElem == null)
	//	logCheckElem = document.getElementById("logCheck");
	if (logging) { //logCheckElem.checked == true) {
		str =  getTime() + ": " + str+"\n";
		var log = document.getElementById('cortexLog');
		if(log)
			log.value =  str + log.value;
	}
}

function error(msg) {
	log("ERROR: " + msg);
	alert("ERROR: " + msg);
	clearInterval(cronID);  // Shuts down cron
}


/***** Basic Server Communication *****/

var localNodeAddr = '';
var originURL = 'Unknown Source';
var connected = false;
var numberOfNodes = 0;
var connections = new Array();	

var dlc = 0; 
var msgQ = new Array();

/* basic ping function for local node
 *  if successful, 
 *    if we haven't greeted the server, we do, 
 *    otherwise nothing (just a heartbeat)
 *  if it fails, lets the user know we have lost 
 *    connection to the node server
 */
function ping() {
	var http = ajaxConnect();
	
	var retfn = returnfn(http,
		function(resp) {
			//log("pong!");
			if (!connected) {
				connected = true;
				greet();
			}
		},
		function(resp) {
			connected = false;
			var html = "Connection to local Node failed.  Try reloading from <a href=\"" + originURL + "\" target=\"window\">" + originURL + "</a>";
			
			stl = document.getElementById('statusLabel');
			if (stl)
				stl.innerHTML = html;	
		}

	);			
	//log("ping!");		
	ajaxSend(http, "cmd=ping\n\n", retfn);
}

function init() { 
	log("init");
	if (connected == false)
		return;
	numberOfNodes = 1;
	if (originURL.substr(0, 4) == "file") {
		// we are the first
		//numberOfNodes = 1; // ourself
		log("Loaded from file");
		// now we sit and wait
	} else { // it was http, so we were loaded from another node
		log("Loaded from " + originURL);
		originAddress = extractHost(originURL);
		join_network(originAddress);
	}
}

/*  Greets the server
 *    so far just gets the server's IP and origin URL
 */
function greet() {
	var http = ajaxConnect();
	
	var retfn = returnfn(http, 
		function(resp) {
			log("greet returned");
			var arr = resp.split(" ");
			localNodeAddr = arr[0];
			originURL = arr[1];
			stl = document.getElementById('statusLabel');
			if (stl)	
				stl.innerHTML = "I am <b>" + localNodeAddr + "</b>";
			init();
		}
	);
	log("send greet msg");
	ajaxSend(http, "cmd=greet\n\n", retfn);
}

// Kill the server
function killServer() {
	announceDead(localNodeAddr);
	var http = ajaxConnect();
	
	var retfn = returnfn(http,
		function(resp) {
			// got a resp, server not dead
			killServer();
		});
	ajaxSend(http, "cmd=kill\n\n", retfn);
}

// Get the latest server logs
function getLog() {
	var http = ajaxConnect();

	var retfn = returnfn(http,
		function(resp) {
			var log = document.getElementById('cortexLog');
			if (log)
				log.value =  resp + log.value;
			// Since getLog returns (a call back is called later)
			// this is tail recursive friendly
			getLog();
		});
	ajaxSend(http, "cmd=getLog\n\n", retfn);
}

/***** Function Registry *****/

var fnreg = new Array;

function registerFn(fnname, fn, preplace) {
	path = fnname.split(".");
	root = fnreg;
	for(i=0; i < path.length-1; i++) {
		if (root[path[i]] == undefined)
			root[path[i]] = new Array();
		root = root[path[i]];
	}
	if (preplace)
		root[path[i]] = fn;
	else {
		if (root[path[i]] == undefined)
			root[path[i]] = [fn, null];
		else {
			j=0;
			while(root[path[i]][j] != null) 
				j++;
			root[path[i]][j] = fn;
			root[path[i]][j+1] = null;
		}
	}	
}
	

function execFn(name, args) {
	log("exec '" + name + "'");
	root = fnreg;
	names = name.split(".");
	for (i=0; i< names.length; i++) {
		log("looking for " + i +":"+names[i] + " in " + root.length + " nodes");
		root = root[names[i]];
		if (root == undefined)
			return false;  // ERROR, NO FN	
	}
	i=0;
	log("found functions");
	while(root[i]) {
		log("exec " + i);
		root[i](args);
		i++;
	}
	return true;
}


/***** Messeging between nodes *****/


function addMsgHandler(msgName, handlerFN, handlerReplace) {
	registerFn("msgHandler." + msgName, handlerFN, handlerReplace);
}

function processMsg(resp) {
	log("processMsg: " + resp['query']);
	if (!execFn("msgHandler." + resp["query"], resp)) 
		log("Error: Uknnown message '" + resp['query'] + "'");
}

function packObject(m, defaultValue) {
	
	var str = "";
	for (var i in m) {
		if (m[i] == '')
		{
			if (defaultValue == null) {
				continue;
			} else {
				m[i] = defaultValue;
			}
		}
		if (i == "results") {
			str += i + "=" + packResults(m[i]) + "\n";
		} else {
			str += i + "=" + m[i] + "\n";
		}
	}
	return str;
}

function sendMsg(m, addr, time, mtype) {
	if(time == null) 
		time = dlc;
	if(mtype == null)
		mtype = "single";

	var str = "cmd=sendMsg\n";
	str += "origin=" + localNodeAddr + "\n";
	str += "dlc=" + time + "\n";
	str += "mtype=" + mtype + "\n";
	
	str += packObject(m);
	
	str += "\n";
	//log ("SEND: " + str);
	
	var http = ajaxConnect();
	var retfn = returnfn(http, null,
		function() {
			disconnect(addr);
			announceDead(addr);
			log("ERROR> message to " + addr + " not delivered: '" + str + "'");
		});
	//log("sendMsg: " + str);	
	ajaxSend(http, str, retfn, addr);
}

function bcastMsg(m) {
	if (m.query != "heartBeat")
		dlc ++;
	//log("BCAST conLen: " + connections.length);
	for(var i=0; i < connections.length; i++) {
		log("bcast "+ i +" " + m.query + " to " + connections[i] + " dlc:" + dlc);
		sendMsg(m, connections[i], dlc, "bcast");
		//log("back from sendMsg, i:" + i + " conlen:" + connections.length);
	}

}

function addMsg(resp) {
	
	for(var i=msgQ.length-1; i>=0; i--) {
		
		if (resp.dlc > msgQ[i].dlc) {
			msgQ[i+1] = msgQ[i];
		} else {
			msgQ[i+1] = resp;
			return;
		}
	}
	msgQ[0] = resp;
}

function parseResp(resp) {
	var lines = resp.split("\n");
	var arr = [];
	for(var i=0; i < lines.length; i++) {
		//var kv = lines[i].split("=");
		var mid = lines[i].indexOf("=");
		var kv = new Array();
		kv[0] = lines[i].substring(0, mid);
		kv[1] = lines[i].substring(mid+1);
		if (kv[1] == "true")
			kv[1] = true;
		else if(kv[0] == "false")
			kv[1] = false;
		else if (kv[0] == "dlc" ||
			kv[0] == "start" ||
			kv[0] == "end" ||
			kv[0] == "min" ||
			kv[0] == "max") 
			kv[1] = Number(kv[1]);
		else if (kv[0] == "results")
			kv[1] = unpackResults(kv[1]);
		arr[kv[0]] = kv[1];
	}
	return arr;
}

function queueMsgs(mstr) {
	log("GOT messages: " + mstr);
	var resps = mstr.split("\n\n");
	for(var rcount=0; rcount < resps.length; rcount++) {
		var resp = resps[rcount];
		if (resp == "") 
			continue;
		resp = parseResp(resp);
		if (resp.query == "DLC") {
			dlc = resp.dlc;
			//var m = new Object();
			//m.query = "DLC";
			//bcastMsg(m);
		} else {
			addMsg(resp);
		}
	}
	var s = "QUEUE: "
	for (var i =0; i< msgQ.length; i++) {
		s += msgQ[i].dlc + " ";
	}
	log(s);
	log("mqlen:" + msgQ.length);
	while (msgQ.length>0 && ((msgQ[msgQ.length-1].dlc - 1) <= dlc)) {
		var r = msgQ.pop();
		log("mdlc: " + r.dlc + " dlc: " + dlc + " mqlen: " + msgQ.length + " type:" + r.mtype + " query: " + r.query);
		if (r.mtype == "bcast")
			dlc = r.dlc
		processMsg(r);
	}
			
}

function getMsgs() {
	var http = ajaxConnect();
	var retfn = returnfn(http, 
		function(resp) {
			//log("getMsgs: " + resp);
			queueMsgs(resp);
			// Since getMsgs returns (a call back is called later)
			// this is tail recursive friendly
			getMsgs(); 
		},
		function() {
			log("ERROR: getMsg RETURN FAIL");
		});
	log("getMsgs");
	ajaxSend(http, "cmd=getMsgs\n\n", retfn);
}


/***** P2P Network Communication *****/

function connectedTo(addr) {
	if (addr == localNodeAddr)
		return true;
	for(i = 0; i < connections.length; i++) {
		if (connections[i] == addr) 
			return true;
	}
	return false;
}

function addConnection(addr) {
	if(!connectedTo(addr)) {
		connections[connections.length] = addr;
		numberOfNodes++;
		return true;
	} else
		return false;
}

function join_network(address, bcast) {
	if(bcast == null) {
		bcast = true;
	}
	log("join_network -> " + address);
	var m = new Object();
	m["query"] = "join_network";
	m["addr"] = localNodeAddr;
	//m["nodes"] = genNodeList();
	sendMsg(m, address);
	if (bcast == true) {
		m = new Object();
		m["query"] = "new_network";
		m["addr"] = address;	
		bcastMsg(m);
	}
}

function genNodeList() { 
	var str = "";//localNodeAddr+",";
	for (var i =0; i < connections.length; i++) {
		str += connections[i] + ",";
	}
	if (connections.length > 0)
		str = str.substring(0,str.length-1);
	return str;
}

function advertiseNewNode(addr) {
	var m = new Object();
	m['query'] = "newNode";
	m['addr'] = addr;
	bcastMsg(m);
}

function announceDead(addr) {
	var m = new Object();
	m['query'] = "deadNode";
	m['addr'] = addr;
	bcastMsg(m);
}

function sendDLC(addr) {
	var m = new Object();
	m.query = "DLC";
	sendMsg(m, addr);
}

function sendWelcome(addrList, addr) {
	var m = new Object();
	m["query"] = "welcome";
	m["addrList"] = addrList;
	sendMsg(m, addr);
}

function heartBeat() {
	var m = new Object();
	m.query = "heartBeat";
	bcastMsg(m);
}

function reloadHTML() {
	var http = ajaxConnect();
	var retfn = returnfn(http);
	ajaxSend(http, "cmd=reloadHTML\n\n",retfn);
}

/*
function poke() {
	var http = ajaxConnect();
	document.getElementById("pingNodeResp").innerHTML = "";
	var dest = document.getElementById("pingNode").value;
	
	var retfn = returnfn(http, 
		function(resp) {
			document.getElementById("pingNodeResp").innerHTML += resp + "<br>";
			var retfn = returnfn(http, 
				function(resp) {
					document.getElementById("pingNodeResp").innerHTML += resp + "<br>";
				});
			ajaxSend(http, "cmd=greet\n\n", retfn, dest);
		});
		
	ajaxSend(http, "cmd=ping\n\n", retfn, dest);
	
	
}
*/

/***** Msg Handlers *****/

function handleNewNode(resp, welcome) {

	if (welcome == null)
		welcome = false;
	var addr = resp.addr;
	//log2("handle new node " + addr + " from " + resp.origin);
	
	// handles re adding if reloaded html
	//if (!connectedTo(addr))
	//{
	var ret = genNodeList();
	var n = addConnection(addr);
	if (welcome == true) {
		sendDLC(addr);
		sendWelcome(ret, addr);	
		//sendLocks(addr);
		//sendTests(addr);
	}
	if (n == true) {
		//sendReqs(addr);
		advertiseNewNode(addr);
	}
}

addMsgHandler( "join_network",
function (resp) {
	handleNewNode(resp, true);
});

addMsgHandler( "newNode",
function (resp) {
	handleNewNode(resp, false);
});

addMsgHandler( "welcome",
function (resp) {
	log("Welcome message received");
	//var myNodes = genNodeList();
	addConnection(resp['origin']);
	if (resp['addrList']){
		var nodes = resp['addrList'].split(",");
		for(var i=0; i < nodes.length; i++){	
			addConnection(nodes[i]);
		}
	}
	
	for(var i =0; i< connections.length; i++) {
		var addr = connections[i];
		if (addr == localNodeAddr)
			continue;
		
		advertiseNewNode(addr);
	}
});

addMsgHandler( "deadNode", 
function (resp) {
	var addr = resp['addr'];
	log("DISCONNECT " + addr);
	// remove from connumberOfNodesnections list
	for (var i=0; i < connections.length; i++) {
		if (connections[i] == addr) {
			connections.splice(i,1);
			numberOfNodes--;
			break;
		}
	}	
});

addMsgHandler( "new_network", 
function (resp) {
	join_network(resp["addr"], false);
});

addMsgHandler( "heartBeat",
function (resp) {
	// do nothing
});


/***** CRON System *****/

// list of intervals
var crontabs = new Array();

/* add a function to be called repeatedly
 *  interval - in 1/10s of a second
 * fn - function to be called
 */
function addCronTab(interval, fn) {
	crontabs[interval] = true;
	registerFn("cron."+interval, fn);
}

var cronI = 0;

function cron() {
	if (connected == false)
		return;
	
	for (time in crontabs) {
		if (cronI % Number(time) == 0) {
			execFn("cron."+ time, null);
		}
	}
	
	cronI += 1;
	// Reset to 0 after a day
	if (cronI >  864000) {
		cronI = 0;
	}
}	

addCronTab(10, ping);
addCronTab(300, heartBeat);


/***** UI *****/
function setStatus() {
	var nn = document.getElementById('numberOfNodes');
	if (nn)
		nn.innerHTML = "Number of nodes: " + numberOfNodes;
	var c = document.getElementById('connections');
	if (c)
		c.innerHTML = "Connected to: " + genNodeList();
	var dlcE = document.getElementById('dlc');
	if (dlcE)
		dlcE.innerHTML = "DLC: " + dlc;
}		

addCronTab(10, setStatus);

/**** INIT *****/

function cortex_start(debug) {
	if(debug)
		logging = true;
	ping();
	var cronID = setInterval("cron()", 100);
	getMsgs();
	getLog();
}


/********** AND THAT's THE BASIS OF THE CORTEX P2P NETWORK **********/
/* We now have dumb do nothing nodes that can connect to each other
 * and maintain state */
/********** NOW TO ADD SOME USEFUL THINGS ON TOP OF IT **********/
