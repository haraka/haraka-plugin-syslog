'use strict';

const constants = require('haraka-constants');

exports.register = function () {
  var plugin = this;

  const syslog = require('modern-syslog');
  plugin.Syslog = syslog;

  var options   = 0;
  plugin.load_syslog_ini();

  if (!plugin.cfg.general) plugin.cfg.general = {};

  var name      = plugin.cfg.general.name     || 'haraka';
  var facility  = plugin.cfg.general.facility || 'MAIL';

  ['pid','odelay','cons','ndelay','nowait'].forEach(opt => {
    if (!plugin.cfg.general[opt]) return;
    options |= syslog['LOG_' + opt.toUpperCase() ];
  })

  switch (facility.toUpperCase()) {
    case 'MAIL':
      syslog.init(name, options, syslog.LOG_MAIL);
      break;
    case 'KERN':
      syslog.init(name, options, syslog.LOG_KERN);
      break;
    case 'USER':
      syslog.init(name, options, syslog.LOG_USER);
      break;
    case 'DAEMON':
      syslog.init(name, options, syslog.LOG_DAEMON);
      break;
    case 'AUTH':
      syslog.init(name, options, syslog.LOG_AUTH);
      break;
    case 'SYSLOG':
      syslog.init(name, options, syslog.LOG_SYSLOG);
      break;
    case 'LPR':
      syslog.init(name, options, syslog.LOG_LPR);
      break;
    case 'NEWS':
      syslog.init(name, options, syslog.LOG_NEWS);
      break;
    case 'UUCP':
      syslog.init(name, options, syslog.LOG_UUCP);
      break;
    case 'LOCAL0':
      syslog.init(name, options, syslog.LOG_LOCAL0);
      break;
    case 'LOCAL1':
      syslog.init(name, options, syslog.LOG_LOCAL1);
      break;
    case 'LOCAL2':
      syslog.init(name, options, syslog.LOG_LOCAL2);
      break;
    case 'LOCAL3':
      syslog.init(name, options, syslog.LOG_LOCAL3);
      break;
    case 'LOCAL4':
      syslog.init(name, options, syslog.LOG_LOCAL4);
      break;
    case 'LOCAL5':
      syslog.init(name, options, syslog.LOG_LOCAL5);
      break;
    case 'LOCAL6':
      syslog.init(name, options, syslog.LOG_LOCAL6);
      break;
    case 'LOCAL7':
      syslog.init(name, options, syslog.LOG_LOCAL7);
      break;
    default:
      syslog.init(name, options, syslog.LOG_MAIL);
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
  let plugin = this;
  let syslog = plugin.Syslog;

  switch (log.level.toUpperCase()) {
    case 'INFO':
      syslog.log(syslog.LOG_INFO, log.data);
      break;
    case 'NOTICE':
      syslog.log(syslog.LOG_NOTICE, log.data);
      break;
    case 'WARN':
      syslog.log(syslog.LOG_WARNING, log.data);
      break;
    case 'ERROR':
      syslog.log(syslog.LOG_ERR, log.data);
      break;
    case 'CRIT':
      syslog.log(syslog.LOG_CRIT, log.data);
      break;
    case 'ALERT':
      syslog.log(syslog.LOG_ALERT, log.data);
      break;
    case 'EMERG':
      syslog.log(syslog.LOG_EMERG, log.data);
      break;
    case 'DATA':
    case 'PROTOCOL':
    case 'DEBUG':
      syslog.log(syslog.LOG_DEBUG, log.data);
      break;
    default:
      syslog.log(syslog.LOG_DEBUG, log.data);
  }

  if (plugin.cfg.always_ok) {
    next(constants.OK);
    return;
  }
  next();
};
