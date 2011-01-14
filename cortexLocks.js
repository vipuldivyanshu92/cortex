/* cortexLocks.js
 * PURPOSE
 * AUTHOR
 * LICENSE
 *
 * NOTES
 */
 
var locks = new Array();
var lockTrys = new Array();
var myLocks = new Array();

function copyobj(arr) {
	c = new Object();
	for (i in arr) {
		c[i] = arr[i];
	}
}

function sendReqs(addr) {
	for(ltype in lockTrys) {
		for (i in lockTrys[ltype]) {
			var lock = lockTrys[ltype][i];
			if (lock == null)
				continue;
			
			var m = copyobj(lock);
			m["query"] = "getLock";
			m["type"] = ltype;
			sendMsg(m, addr);
	}
}

function sendLocks(addr) {
	for (ltype in locks) {
		for (var i in locks[ltype]) {
			log ("testLog[" + i + "]");
			var l = testLocks[ltype][i];
			var m = copyobj(l);
		
			m["query"] = "addLock";
			m["type"] = ltype;
			
			sendMsg(m, addr);
		}
	}
}

function handleAddLock(resp) {
	if(resp['locked'] == null) 
			resp['locked'] = false;
	// dont add/overwrite if exists?		
	var lock = retrieveLock(resp);
		
	if (resp['type'] == "test" ) {//&& (lock == null || lock.addr == null)) {
		var locks = getLockType(resp['type']);
		
		
		locks[resp['name']] = resp
		if(resp['running'] == true) {
			runningTests.push(resp['name']);
		}
	} else if(resp['type'] == "range" && lock.addr == null) {
		log("Add range lock: " + resp['name'] + " (" + resp['start'] + " to " + resp['end'] + ") : ");
		var lock = getRangeLock(resp['name'], resp['start'], resp['end']);
		
		lock.addr = resp['addr'];
		lock.locked = resp['locked'];
		lock.done = resp['done'];
		lock.results = resp['results'];
		lock.name = resp['name'];
	}
}

