/* consts and stuff */

const Cc = Components.classes;
const Ci = Components.interfaces;

var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService)
  .getBranch('extensions.relic.');

prefs.QueryInterface(Ci.nsIPrefBranch2);

function getPref(name, value) {
  var kind = prefs.getPrefType(name);

  switch (kind) {
  case prefs.PREF_BOOL:
    return prefs.getBoolPref(name);
  case prefs.PREF_INT:
    return prefs.getIntPref(name);
  case prefs.PREF_STRING:
    return prefs.getCharPref(name);
  default:
    return value;
  }
}

function log(str) {
  dump("relic: " + str + "\n");
}

var _licensekey;
var _data;


var _timer = Cc['@mozilla.org/timer;1']
               .createInstance(Ci.nsITimer);

function setupTimer(delay) {
  _timer.cancel();
  _timer.initWithCallback({notify: getUpdate}, delay*1000, Ci.nsITimer.TYPE_REPEATING_SLACK);
}

/* listener for windows */

var _listeners = [];

function addListener(listener) {
  _listeners.push(listener);
  if (_data) {
    listener.onNotify(_data);
  }
  else {
    getUpdate();
  }
}

function removeListener(listener) {
  _listeners.delete(listener); // FIXME
}

function notifyListeners(msg) {
  _listeners.forEach(
    function notify(listener) {
      try {
        listener.onNotify(msg);
      } catch(e) {
        dump("Error notifying listener: " + e + "\n");
      }
    }
  );
}


/* api integration */
function getUpdate() {
  xhr("http://rpm.newrelic.com/accounts.xml?include=application_health",
      function(xml) {
        _data = xml;
        notifyListeners(xml);
      });
}

function xhr(url, onSuccess, onFailure) {
  if (_licensekey) {
    var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
    req.mozBackgroundRequest = true;

    req.onload = function() {
      if (req.status == 200) {
        var response = req.responseText; // bug 270553
        response = response.replace(/^<\?xml\s+version\s*=\s*(["'])[^\1]+\1[^?]*\?>/, ""); // bug 336551
        var e4x = new XML(response);

        onSuccess(e4x);
      }
    };
    req.open("GET", url);
    req.setRequestHeader("x-license-key", _licensekey);
    req.send(null);
  }
}

/* watch for updates to the licensekey pref */

var prefObserver = {
  observe: function(subject, topic, data) {
    if (topic != "nsPref:changed") {
      return;
    }

    if (data=='licensekey') {
      _licensekey = prefs.getCharPref("licensekey");
      getUpdate();
    }
    if (data=='interval') {
      _interval = prefs.getIntPref("interval");
      setupTimer(_interval);
    }
  }
};

prefs.addObserver('', prefObserver, false);

try {
  _licensekey = getPref("licensekey");
  _interval = getPref("interval", 60);
  setupTimer(_interval);
  getUpdate();
} catch(e) {}

/* exposed parts of service */

var EXPORTED_SYMBOLS = ['svc'];
svc = {};
svc.addListener = addListener;
svc.getPref = getPref;
svc.removeListener = removeListener;
svc.update = getUpdate;
svc.licensekey = function() {
  if (_licensekey && _licensekey != '') {
    return _licensekey;
  }
}
