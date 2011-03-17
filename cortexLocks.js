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
	args["family"] = family;
	ltype = locks[family].type;
	args["locks"] = locks[family].locks;
	return execFn("locks."+ltype+"."+fnName, args);
}

/**** Lock Functions
 * BR lookup(details) # get lock data struct (lookup?)
 * BR remove(addr/owner)
 * BR isLocked(details)
 * BR aquire(details) # aquire lock (aquire?)
 * BR equals(a, b)
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


registerLockFn("basic", "remove",
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


registerLockFn("range", "remove",
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

function genLockTry(lockTry) {	
	lockTry.time = getTime();
	lockTry.dlc = dlc+1;
	lockTry.name = name;
	lockTry.addr = localNodeAddr;
	lockTry.type = type;
	lockTry.okay = 1;
	lockTry.locked = false;
	var d = new Date();
	lockTry.localTime = d.getTime();
}

function genGetLockMsg() {
	var m = new Object();
	m["query"] = "getLock";
	m["time"] = lockTry.time;
	m["addr"] = localNodeAddr;
	return m;
}

registerLockFn("basic", "aquire",
function(args) { 
	var locks = args['locks'];
	var name = args['name'];
	var lockTry;
	
	if(locks[name] == null) {
		locks[name] = new Object();
	}
	lockTry = locks[name];

	genLockTry(lockTry);

	lockTrys[args['family']] = lockTry;
	setTestStatus("Acquiring lock for test '" + name + "' " + lockTry.okay + "/" + numberOfNodes + "...", "yellow");
	
	var m = getLockMsg();
	m["name"] = name;	
	m["type"] = "basic";

	bcastMsg(m);
});

registerLockFn("range", "aquire",
function(args) { 
	var name = args['name'];
	var start = args['start'];
	var end = args['end'];

	lockTry = getRangeLock(args['locks'], name, start, end);
	if (!lockTry) {
		error("Cannot get range lock in getLock(" + name +", "+ start + ", " + end + ")");
		return;
	}
	
	genLockTry(lockTry);	

	lockTrys[args['family']] = lockTry;
	setWorkStatus("Acquiring lock for work '" + name + "' (" + lockTry.start + " to " + lockTry.end + ")" + lockTry.okay + "/" + numberOfNodes + "...", "yellow");

	var m = getLockMsg();
	m["name"] = name;	
	m["type"] = "range";

	
	m["start"] = start;
	m["end"] = end;

	bcastMsg(m);	
});

function lockTypesEqual(a, b) {
	if(a == null || b == null)
		return false;
	if(a['type'] != b['type'])
		return false;
	return true;
}

registerLockFn("basic", "equals",
function(args) { // locksEqual(a, b) 
	var a = args['a'];
	var b = arbs['b'];
	if (!lockTypesEqual(a, b)) 
		return false;
	if (a.name == b.name)
		return true;
	else
		return false;
});

registerLockFn("range", "equals",
function(args) { // locksEqual(a, b) 
	var a = args['a'];
	var b = arbs['b'];
	if (!lockTypesEqual(a, b)) 
		return false;

	log("locksEqual? " + a.name + " (" + a.start + " to " + a.end + ") and " + b.name + " (" + b.start + " to " + b.end + ")");
	if (a.name == b.name && a.start == b.start && a.end == b.end) {
		log("true");
		return true;
	} else {
		log("false");
		return false;
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
