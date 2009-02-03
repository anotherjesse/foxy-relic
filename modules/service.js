/* consts and stuff */

const Cc = Components.classes;
const Ci = Components.interfaces;

var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService)
  .getBranch('extensions.relic.');

prefs.QueryInterface(Ci.nsIPrefBranch2);

var _licensekey;
var _data;

/* listener for windows */

var _listeners = [];

function addListener(listener) {
  _listeners.push(listener);
  if (_data) {
    listener.onNotify(_data);
  }
  else {
    get_apps();
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

/* web service urls */


function accounts_url() {
  return "http://rpm.newrelic.com/accounts.xml";
}

function apps_url(app_id) {
  return "http://rpm.newrelic.com/accounts/" + app_id + "/applications.xml";
}

var _apps = {};

/* api integration */
function get_apps() {

  _accounts = {};

  function add_account(account_id, name) {
    _accounts[account_id] = { name: name };

    xhr(apps_url(account_id), function(xml) {
          var apps = {};

          var applications = xml.getElementsByTagName('application');
          for (var i = 0; i<applications.length; i++) {
            apps[applications[i].getElementsByTagName('id')[0].firstChild.data] = {
              name: applications[i].getElementsByTagName('name')[0].firstChild.data,
              url: applications[i].getElementsByTagName('overview-url')[0].firstChild.data
            };
          }
          _accounts[account_id].apps = apps;
        });
  }

  xhr(accounts_url(), function(xml) {
        var accounts = xml.getElementsByTagName('account');
        for (var i = 0; i<accounts.length; i++) {
          add_account(accounts[i].getElementsByTagName('id')[0].firstChild.data,
                      accounts[i].getElementsByTagName('name')[0].firstChild.data);
        }
      });

}

function xhr(url, onSuccess, onFailure) {
  if (_licensekey) {
    var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"]
      .createInstance(Ci.nsIXMLHttpRequest);
    req.mozBackgroundRequest = true;

    req.onload = function() {
      if (req.status == 200) {
        onSuccess(req.responseXML);
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
      get_apps();
    }
  }
};

prefs.addObserver('', prefObserver, false);

try {
  _licensekey = prefs.getCharPref("licensekey");
  get_apps();
} catch(e) {}

/* exposed parts of service */

var EXPORTED_SYMBOLS = ['svc'];
svc = {};
svc.addListener = addListener;
svc.removeListener = removeListener;
svc.accounts = function() {
  return _accounts;
}
svc.update = get_apps;
svc.licensekey = function() {
  if (_licensekey && _licensekey != '') {
    return _licensekey;
  }
}
