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
 * BR retriveLock(details) # get lock data struct (lookup?)
 * BR removeLocks(addr/owner)
 * BR isLocked(details)
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

function genRangeCell(name, start, end, next) {
	var c = new Object();
	c.name = name;
	c.start=start;
	c.end = end;
	c.next = next;
	c.locked = false;
	c.done = false;
	return c;
}

function getRangeLock(rangeLocks, name, start, end) {
	log("getRangeLock for (" + name + " from " + start + " to " + end + ")");
	if (!rangeLocks[name]) {
		log("no locks for " + name + ", so MAKING");
		rangeLocks[name] = genRangeCell(name, start, end);
		return rangeLocks[name];
	} 
	log("locks exist for " + name + " so SEARCHING forward");
	var rlock = rangeLocks[name];
	
	if(end < rlock.start) {
		log("Space before first lock, MAKING HERE");
		rangeLocks[name] = genRangeCell(name, start, end);
		rangeLocks[name].next = rlock;
		return rangeLocks[name];
	}
	
	while(rlock.next && rlock.start < rlock.end+1) {
		log("looking at (" + rlock.start + " to " + rlock.end + ")");
		if (rlock.start == start && rlock.end == end) {
			log("FOUND IT");
			return rlock;
		}
		
		if (rlock.end < start && rlock.next.start > end) {
			log("GAP between (" + rlock.start + " to " + rlock.end + ") and (" + rlock.next.start + " to " + rlock.next.end + ") where we should be so MAKING THERE");
			var nlock = rlock.next;
			rlock.next = genRangeCell(name, start, end);
			rlock.next.next = nlock;
			return rlock.next;
		}
		
		rlock = rlock.next;
	}
	log("SEARCH ended");
	if (rlock.start == start && rlock.end == end) {
		log("Found it!");	
		return rlock;
	} else {
		if (rlock.end < start) {
			log("There is space at the end to make what we want");
			rlock.next = genRangeCell(name, start, end);
			return rlock.next;
		} else {
			log("search ended after what we wanted, FAIL");
			return null;
		}
	}
	
}

registerLockFn("range", "lookup",
function (args) {
	var l = getRangeLock(arg['locks'] , args['name'], args['start'], args'[end']);
	if (l == null) 
		error("retrieveLock for range got null");
	return l;
});


registerLockFn("basic", "isLocked",
function(args) {
	var locks = args['locks'];
	if (locks[args['name']] == null)
		return false;
	else 
		return locks[args['name']].locked;
});
	
registerLockFn("range", "isLocked",
function (args) {
	var rlock = getRangeLock(args['locks'], args['name'], args['start'], args['end']);
	if (rlock)
		return rlock.locked;
	else 
		return false;
});


registerLockFn("basic", "removeLocks",
function(args) {
	for(var i in args['locks']) {
		var lock = args['locks'][i];
		if (!lock)
			continue;
		if (lock.addr == addr) {
			lock.locked = false;
		}
	}
});


registerLockFn("range", "removeLocks",
function(args) {
	for(var i in args['locks']) {
		log("freeing " + i + " locks");
		var rlock = args['locks'][i];
		while (rlock != null) {
			log("looking at " + i + " (" + rlock.start + " to " + rlock.end + ") : " + rlock.addr);
			if (rlock.addr == args['addr']) {
				log("unlocking");
				rlock.locked = false;
			}
			rlock = rlock.next;
		}
	}
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
		var lock = getRangeLock(LOCKS, resp['name'], resp['start'], resp['end']);
		
		lock.addr = resp['addr'];
		lock.locked = resp['locked'];
		lock.done = resp['done'];
		lock.results = resp['results'];
		lock.name = resp['name'];
	}
}

addMessageHandler("addLock", handlerAddLock());




function removeNodeLocks(addr) {
	removeNodeRangeLocks(resp['addr']);
}

addMsgHandler("deadNode", 
function (resp) {
	BASIC
	
	removeNodeLocks(resp['addr']);
});
