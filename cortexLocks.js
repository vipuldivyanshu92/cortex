/* cortexLocks.js
 * PURPOSE
 * AUTHOR
 * LICENSE
 *
 * NOTES
 */
 
/* locks -> [ name:[type, locks], ] */
var locks = new Array();
var lockTrys = new Array();
var myLocks = new Array();

function copyobj(arr) {
	c = new Object();
	for (i in arr) {
		c[i] = arr[i];
	}
}

function registerLockFn(ltype, fnName, fn) {
	registerFn("locks." +ltype+"."+fnName, fn);
}

function execLockFn(family, fnName, args) {
	ltype = locks[family].type;
	args["locks"] = locks[family].locks;
	return execFn("locks."+ltype+"."+fnName, args);
}

/**** Lock Functions
 * retriveLock(details) # get lock data strict (lookup?)
 * removeLocks(owner)
 * isLocked(details)
 * getLock(details) # aquire lock (aquire?)
 * equals(a, b)
 * lock
 * release
 * make?
*/

registerLockFn("basic", "lookup", 
function (args) {
	return args["locks"][args["name"]];
});

registerLockFn("range", "lookup",
function (args) {
	/******* vvvvvvvvvv *********/
	var l = getRangeLock(struct.name, struct.start, struct.end);
	if (l == null) 
		error("retrieveLock for range got null");
	return l;
});


/**** Logical Lock using functions
 * grant(resp, lock
 * deny(resp, lock
 * handleLockReq
 * handleLockResp
 * lockGranted
 * checkLocks
 * ...
 */

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



function removeNodeRangeLocks(addr) {
	for(var i in rangeLocks) {
		log("freeing " + i + " locks");
		var rlock = rangeLocks[i];
		while (rlock != null) {
			log("looking at " + i + " (" + rlock.start + " to " + rlock.end + ") : " + rlock.addr);
			if (rlock.addr == addr) {
				log("unlocking");
				rlock.locked = false;
			}
			rlock = rlock.next;
		}
	}
}

function removeNodeLocks(addr) {
	removeNodeRangeLocks(resp['addr']);
}

addMsgHandler("deadNode", 
function (resp) {
	for(var i in testLocks) {
		var lock = testLocks[i];
		if (!lock)
			continue;
		if (lock.addr == addr) {
			lock.locked = false;
		}
	}
	
	removeNodeLocks(resp['addr']);
});
