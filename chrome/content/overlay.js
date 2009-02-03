var relic = new function() {
  var inst = this;

  Cu.import("resource://relic/service.js");

  var $ = function(x) { return document.getElementById(x); };

  this.preferences = function() {
    window.openDialog('chrome://relic/content/config.xul', 'config', 'centerscreen,chrome,modal');
  };

  this.show = function() {
    if (svc.licensekey()) {
      document.showPopup($('foofighter'), 0, 0, "popup", "bottomleft", "topleft");
    }
    else {
      window.openDialog('chrome://relic/content/config.xul', 'config', 'centerscreen,chrome,modal');
    }
  };

  function addMenuItem(account, app, node) {
    var menuitem = document.createElement('menuitem');
    menuitem.setAttribute('label', account.name + '/' + app.name);
    menuitem.onclick = function() {
      openUILinkIn(app.url, 'tab');
    };
    node.appendChild(menuitem);
  }

  this.popup = function(node) {
    if (!svc.licensekey()) {
      return window.openDialog('chrome://relic/content/config.xul', 'config', 'centerscreen,chrome,modal');
    }


    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    var accounts = svc.accounts();
    for (var account_id in accounts) {
      var account = accounts[account_id];
      for (var app_id in account.apps) {
        addMenuItem(account, account.apps[app_id], node);
      }
    }
  }

  this.onNotify = function(data) {
  };

  function init() {
    svc.addListener(inst);
    window.removeEventListener('load', init, false);
  }

  window.addEventListener('load', init, false);
};
