var relic = new function() {
  var inst = this;

  inst.url = 'http://rpm.newrelic.com';

  Cu.import("resource://relic/service.js");

  var $ = function(x) { return document.getElementById(x); };

  this.preferences = function() {
    window.openDialog('chrome://relic/content/config.xul', 'config', 'centerscreen,chrome,modal');
  };

  this.show = function(event) {
    if (svc.licensekey()) {
      openUILinkIn(inst.url, whereToOpenLink(event));
    }
    else {
      window.openDialog('chrome://relic/content/config.xul', 'config', 'centerscreen,chrome,modal');
    }
  };

  function addMenuItem(app, node, sibling) {
    var menuitem = document.createElement('menuitem');
    menuitem.setAttribute('label', app['name']);
    menuitem.onclick = function() {
      currentApp = app['name'];
      updateStats(app);
    };
    node.insertBefore(menuitem, sibling);
  }

  function updateMenu(apps) {
    var menu = $('relic-apps');
    for (var i=menu.childNodes.length-1; i>=0; i--) {
      var node = menu.childNodes[i];
      if (!node.getAttribute('perma')) {
        menu.removeChild(node);
      }
    }

    var sibling = menu.firstChild;

    for (var i=0; i<apps.length(); i++) {
      addMenuItem(apps[i], menu, sibling);
    }
  }

  var currentApp = null;

  this.onNotify = function(data) {
    var apps = data..application;
    updateMenu(apps);

    var app;
    for (var i=0; i<apps.length(); i++) {
      if (apps[i]['name'] == currentApp) {
        app = apps[i];
      }
    }
    if (!app) {
      app = apps[0];
      currentApp = app['name'];
    }

    updateStats(app);
  };

  function updateStats(app) {
    $('relic-button').setAttribute('label', app['name']);

    inst.url = app['overview-url'];

    var metrics = app..threshold_value;
    for (var i=0; i<metrics.length(); i++) {
      var metric = metrics[i];
      var domid = 'relic-' + metric.@name.replace(' ', '-', 'g');

      var stat = $(domid);
      if (!stat) {
        stat = document.createElementNS('http://www.w3.org/1999/xhtml', 'img');
        stat.setAttribute('id', domid);
      }

      stat.setAttribute('tooltiptext', metric.@name + ': ' + metric.@formatted_metric_value);
      stat.setAttribute('id', 'relic-' + metric.@name.replace(' ', '-', 'g'));
      switch (metric.@threshold_value+'') {
      case '1':
        stat.setAttribute('src', 'chrome://relic/skin/green_light.png');
        break;
      case '2':
        stat.setAttribute('src', 'chrome://relic/skin/yellow_light.png');
        break;
      case '3':
        stat.setAttribute('src', 'chrome://relic/skin/red_light.png');
      }
      stat.setAttribute('class', 'threshold' + metric.@threshold_value);
      $('relic-stats').appendChild(stat);
    }
  };

  function init() {
    svc.addListener(inst);
    window.removeEventListener('load', init, false);
  }

  window.addEventListener('load', init, false);
};
