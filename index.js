'use strict'

const constants = require('haraka-constants')
const syslog = require('modern-syslog')
const utils = require('haraka-utils')

exports.register = function () {
  this.load_syslog_ini()
  this.init_syslog()
  this.register_hook('log', 'syslog')
}

exports.init_syslog = function () {
  let options = 0
  for (const opt of ['pid', 'odelay', 'cons', 'ndelay', 'nowait']) {
    if (this.cfg.general[opt]) options |= syslog[`LOG_${opt.toUpperCase()}`]
  }
  const name = this.cfg.general.name || 'haraka'
  const facility = this.cfg.general.facility?.toUpperCase() || 'MAIL'
  syslog.init(name, options, syslog[`LOG_${facility}`] ?? syslog.LOG_MAIL)
}

exports.load_syslog_ini = function () {
  this.cfg = this.config.get(
    'syslog.ini',
    {
      booleans: [
        '+general.pid',
        '+general.odelay',
        '-general.cons',
        '-general.ndelay',
        '-general.nowait',
        '-general.always_ok',
      ],
    },
    () => {
      this.load_syslog_ini()
      // skip on the initial call from register()
      if (this.hooks?.log) this.init_syslog()
    },
  )

  if (!this.cfg.general) this.cfg.general = {}
}

exports.syslog = function (next, logger, log) {
  const data = utils.sanitize(log.data, { replacement: ' ', keepTab: true })
  switch (log.level.toUpperCase()) {
    case 'INFO':
      syslog.log(syslog.LOG_INFO, data)
      break
    case 'NOTICE':
      syslog.log(syslog.LOG_NOTICE, data)
      break
    case 'WARN':
      syslog.log(syslog.LOG_WARNING, data)
      break
    case 'ERROR':
      syslog.log(syslog.LOG_ERR, data)
      break
    case 'CRIT':
      syslog.log(syslog.LOG_CRIT, data)
      break
    case 'ALERT':
      syslog.log(syslog.LOG_ALERT, data)
      break
    case 'EMERG':
      syslog.log(syslog.LOG_EMERG, data)
      break
    case 'DATA':
    case 'PROTOCOL':
    case 'DEBUG':
      syslog.log(syslog.LOG_DEBUG, data)
      break
    default:
      syslog.log(syslog.LOG_DEBUG, data)
  }

  if (this.cfg.general.always_ok) {
    next(constants.OK)
    return
  }
  next()
}
