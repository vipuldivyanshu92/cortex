/* cortexLocks.js
 * PURPOSE
 * AUTHOR
 * LICENSE
 *
 * NOTES
 */
 
/* locks -> [ class: [type, locks], ] */
var locks = new Array();
/* -> [ class : lock] (you can only req/acq 1 lock per class */
var locksReq = new Array();
var locksAcq = new Array();

function copyobj(arr) {
	c = new Object();
	for (i in arr) {
		c[i] = arr[i];
	}
}

function locksClassType(klass) {
	return locks[klass]['type'];
}

function locksClassLocks(klass) {
	return locks[klass]['locks'];
}

function registerLockFn(ltype, fnName, fn) {
	registerFn("locks." +ltype+"."+fnName, fn);
}
/*
function execLockFn(fnName, args) {
	type = locksClassType(args['class']);
	args['type'] = type;
	locks = locksClassLocks(args['class']);
	args['locks'] = locks;
	return execFn("locks."+type+"."+fnName, args);
}*/

function locksInitClass(klass, type) {
	locks[klass]['type'] = type;
	locks[klass]['locks'] = new Array();
	
	locksReq[klass] = new Array();
	locksAcq[klass] = new Array();
}



/**** Core Lock Functions
 * get(table, info) BR -> getLock
 * equal(a, b) - > locksEqual
 * ?msg(lock)
*/

function getLock(info) {
	type = locksClassType(info['class']);
	info['type'] = type;
	locks = locksClassLocks(info['class']);
	info['locks'] = locks;
	return execFn("locks."+type+".get", info);
}

registerLockFn("basic", "get", 
function (args) {
	lock = args['locks'][args['name']];
	if ( ! lock.name) {
		lock.name =args['name'];
		lock.locked = false;
		lock.type = 'basic';
	}
	return lock;
});

function genRangeCell(name, start, end, next) {
	var c = new Object();
	c.name = name;
	c.type = 'range';
	c.start=start;
	c.end = end;
	c.next = next;
	c.locked = false;
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

registerLockFn("range", "get",
function (args) {
	var l = getRangeLock(arg['locks'] , args['name'], args['start'], args'[end']);
	if (l == null) 
		error("retrieveLock for range got null");
	return l;
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

functions locksEqual(a, b) {
	args = new Array();
	args['a'] = a;
	args['b'] = b;
	return execFn("locks."+a['type']+".equals", args);
}

	
/*** Non Networked Lock functions
 * lock
 * release
 * isLocked
 * removeLocks
 */

function isLocked(lock) {
	return lock.locked;
}

function lock(lock) {
	lock['locked'] = true;
}

function release(lock) {
	lock['locked'] = false;
}

/************** REVIEW HERE ******************/

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






registerLockFn("basic", "release",
function (args) {
	var lock = myLocks[type];
	myLocks[type] = null;
	
	lock.locked = false;
	
	
	var m = new Object();
	m["query"] = "releaseLock";
	m["type"] = type;
	m["name"] = lock.name;
	if (type == "range") {
		m["start"] = lock.start;
		m["end"] = lock.end;
	}
		
	bcastMsg(m);
}


/**** Netowkr Lock using functions
 * aquire
 * grant(resp, lock
 * deny(resp, lock
 * handleLockReq
 * handleLockResp
 * lockGranted
 * checkLocks
 * ...
 */
 
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
