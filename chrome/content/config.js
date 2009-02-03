const Cc = Components.classes;
const Ci = Components.interfaces;

var $ = function(x) { return document.getElementById(x); };
var prefs = Cc['@mozilla.org/preferences-service;1']
  .getService(Ci.nsIPrefService)
  .getBranch('extensions.relic.');

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

function setPref(name, value) {
  switch (typeof value) {
  case 'boolean':
    return prefs.setBoolPref(name, value);
  case 'number':
    return prefs.setIntPref(name, value);
  case 'string':
    return prefs.setCharPref(name, value);
  }
};

function init() {
  /* populate with the current settings */
  $('licensekey').value = getPref('licensekey', '');
  $('interval').value = getPref('interval', 60);
}

function save() {
  setPref('licensekey', $('licensekey').value);
  setPref('interval', parseInt($('interval').value));
}
