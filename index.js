'use strict';

const constants = require('haraka-constants');
const syslog    = require('modern-syslog');

exports.register = function () {
  let plugin = this;

  let options = 0;

  plugin.load_syslog_ini();

  let name      = plugin.cfg.general.name     || 'haraka';
  let facility  = plugin.cfg.general.facility || 'MAIL';

  ['pid','odelay','cons','ndelay','nowait'].forEach(opt => {
    if (!plugin.cfg.general[opt]) return;
    options |= syslog['LOG_' + opt.toUpperCase() ];
  })

  if (facility !== facility.toUpperCase()) facility = facility.toUpperCase();

  switch (facility) {
    case 'MAIL':
    case 'KERN':
    case 'USER':
    case 'DAEMON':
    case 'AUTH':
    case 'SYSLOG':
    case 'LPR':
    case 'NEWS':
    case 'UUCP':
    case 'LOCAL0':
    case 'LOCAL1':
    case 'LOCAL2':
    case 'LOCAL3':
    case 'LOCAL4':
    case 'LOCAL5':
    case 'LOCAL6':
    case 'LOCAL7':
      syslog.init(name, options, syslog[ 'LOG_' + facility ]);
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

  if (!plugin.cfg.general) plugin.cfg.general = {};
}

exports.syslog = function (next, logger, log) {
  let plugin = this;

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

  if (plugin.cfg.general.always_ok) {
    next(constants.OK);
    return;
  }
  next();
};
