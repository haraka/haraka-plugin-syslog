'use strict';

const constants = require('haraka-constants');

exports.register = function () {
  var plugin = this;

  plugin.Syslog = require('modern-syslog');

  var options   = 0;
  plugin.load_syslog_ini();

  if (!plugin.cfg.general) plugin.cfg.general = {};

  var name      = plugin.cfg.general.name     || 'haraka';
  var facility  = plugin.cfg.general.facility || 'MAIL';

  ['pid','odelay','cons','ndelay','nowait'].forEach(opt => {
    if (!plugin.cfg.general[opt]) return;
    options |= plugin.Syslog['LOG_' + opt.toUpperCase() ];
  })

  switch (facility.toUpperCase()) {
    case 'MAIL':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_MAIL);
      break;
    case 'KERN':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_KERN);
      break;
    case 'USER':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_USER);
      break;
    case 'DAEMON':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_DAEMON);
      break;
    case 'AUTH':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_AUTH);
      break;
    case 'SYSLOG':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_SYSLOG);
      break;
    case 'LPR':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LPR);
      break;
    case 'NEWS':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_NEWS);
      break;
    case 'UUCP':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_UUCP);
      break;
    case 'LOCAL0':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL0);
      break;
    case 'LOCAL1':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL1);
      break;
    case 'LOCAL2':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL2);
      break;
    case 'LOCAL3':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL3);
      break;
    case 'LOCAL4':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL4);
      break;
    case 'LOCAL5':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL5);
      break;
    case 'LOCAL6':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL6);
      break;
    case 'LOCAL7':
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_LOCAL7);
      break;
    default:
      plugin.Syslog.init(name, options, plugin.Syslog.LOG_MAIL);
  }

  plugin.register_hook('log', 'syslog');
};

exports.load_syslog_ini = function () {
  let plugin = this;

  plugin.cfg = plugin.config.get('syslog.ini', {
    booleans: [
      '+general.pid',
      '+general.odelay',
      '-general.cons',
      '-general.ndelay',
      '-general.nowait',
      '-general.always_ok',
    ],
  },
  function () {
    plugin.load_syslog_ini();
  })
}

exports.syslog = function (next, logger, log) {
  var plugin = this;

  switch (log.level.toUpperCase()) {
    case 'INFO':
      plugin.Syslog.log(plugin.Syslog.LOG_INFO, log.data);
      break;
    case 'NOTICE':
      plugin.Syslog.log(plugin.Syslog.LOG_NOTICE, log.data);
      break;
    case 'WARN':
      plugin.Syslog.log(plugin.Syslog.LOG_WARNING, log.data);
      break;
    case 'ERROR':
      plugin.Syslog.log(plugin.Syslog.LOG_ERR, log.data);
      break;
    case 'CRIT':
      plugin.Syslog.log(plugin.Syslog.LOG_CRIT, log.data);
      break;
    case 'ALERT':
      plugin.Syslog.log(plugin.Syslog.LOG_ALERT, log.data);
      break;
    case 'EMERG':
      plugin.Syslog.log(plugin.Syslog.LOG_EMERG, log.data);
      break;
    case 'DATA':
    case 'PROTOCOL':
    case 'DEBUG':
      plugin.Syslog.log(plugin.Syslog.LOG_DEBUG, log.data);
      break;
    default:
      plugin.Syslog.log(plugin.Syslog.LOG_DEBUG, log.data);
  }

  if (plugin.cfg.always_ok) {
    next(constants.OK);
    return;
  }
  next();
};
