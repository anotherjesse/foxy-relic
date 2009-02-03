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

  this.onNotify = function(data) {
    var box = $('relic-stats');

    var app = data..application[0];

    var metrics = app..threshold_value;
    for (var i=0; i<metrics.length(); i++) {
      var metric = metrics[i];
      var domid = 'relic-' + metric.@name.replace(' ', '-', 'g');

      var stat = $(domid);
      if (!stat) {
        stat = document.createElement('label');
        stat.setAttribute('id', domid);
      }

      stat.setAttribute('value', metric.@name);
      stat.setAttribute('tooltiptext', metric.@formatted_metric_value);
      stat.setAttribute('id', 'relic-' + metric.@name.replace(' ', '-', 'g'));
      stat.setAttribute('class', 'threshold' + metric.@threshold_value);
      box.appendChild(stat);
    }
  };

  function init() {
    svc.addListener(inst);
    window.removeEventListener('load', init, false);
  }

  window.addEventListener('load', init, false);
};
