'use strict'

const assert = require('node:assert')
const { describe, it, beforeEach } = require('node:test')

const fixtures = require('haraka-test-fixtures')
const constants = require('haraka-constants')

const stub = fixtures.stub.stub

let backup
let plugin
let log
let configfile
let logger

const _set_up = () => {
  backup = { plugin: { Syslog: {} } }

  plugin = new fixtures.plugin('syslog')

  // stub out functions
  log = stub()
  log.level = 'INFO'
  log.data = 'this is a test log message'

  // some test data
  configfile = {
    general: {
      name: 'haraka',
      facility: 'MAIL',
      log_pid: 1,
      log_odelay: 1,
      log_cons: 0,
      log_ndelay: false,
      log_nowait: 'random',
      always_ok: false,
    },
  }

  if (plugin) {
    plugin.config.get = function () {
      return configfile
    }
  }
}

describe('register', () => {
  beforeEach(_set_up)

  it('should have register function', () => {
    if (plugin) {
      assert.ok(plugin)
      assert.equal(typeof plugin.register, 'function')
    }
  })

  it('register function should call register_hook()', () => {
    if (plugin && plugin.Syslog) {
      plugin.register()
      assert.ok(Object.keys(plugin.hooks).length > 0)
    }
  })

  it('register_hook() should register for proper hook', () => {
    if (plugin && plugin.Syslog) {
      plugin.register()
      assert.ok(plugin.hooks.log)
    }
  })

  it('register_hook() should register available function', () => {
    if (plugin && plugin.Syslog) {
      plugin.register()
      assert.ok(plugin.hooks.log.includes('syslog'))
      assert.ok(plugin.syslog)
      assert.equal(typeof plugin.syslog, 'function')
    }
  })

  it('register calls Syslog.init()', () => {
    // local setup
    if (plugin && plugin.Syslog) {
      backup.plugin.Syslog.init = plugin.Syslog.init
      plugin.Syslog.init = stub()
      plugin.register()

      assert.ok(plugin.Syslog.init.called)
    }

    // local teardown
    if (plugin && plugin.Syslog) {
      plugin.Syslog.init = backup.plugin.Syslog.init
    }
  })

  it('register calls Syslog.init() with correct args', () => {
    // local setup
    if (plugin && plugin.Syslog) {
      backup.plugin.Syslog.init = plugin.Syslog.init
      plugin.Syslog.init = stub()
      plugin.register()

      assert.ok(plugin.Syslog.init.called)
      assert.equal(
        plugin.Syslog.init.args[0],
        plugin.config.get('test').general.name,
      )
      assert.equal(
        plugin.Syslog.init.args[1],
        plugin.Syslog.LOG_PID | plugin.Syslog.LOG_ODELAY,
      )
      assert.equal(plugin.Syslog.init.args[2], plugin.Syslog.LOG_MAIL)
    }

    // local teardown
    if (plugin && plugin.Syslog) {
      plugin.Syslog.init = backup.plugin.Syslog.init
    }
  })
})

describe('hook', () => {
  beforeEach(_set_up)

  it('returns just next() by default (missing always_ok)', () => {
    if (!plugin || !plugin.Syslog) {
      return
    }

    const next = function (action) {
      test.isUndefined(action)
    }

    plugin.syslog(next, logger, log)
  })

  it('returns just next() if always_ok is false', () => {
    // local setup
    backup.configfile = configfile
    configfile.general.always_ok = 'false'
    if (!plugin || !plugin.Syslog) {
      return
    }

    plugin.register()

    plugin.syslog(
      function (action) {
        test.isUndefined(action)
      },
      logger,
      log,
    )
  })

  it('returns next(OK) if always_ok is true', () => {
    if (!plugin || !plugin.Syslog) {
      return
    }

    // local setup
    backup.configfile = configfile
    configfile.general.always_ok = 'true'
    plugin.register()

    plugin.syslog(
      function (action) {
        assert.equal(action, constants.OK)
      },
      logger,
      log,
    )

    // local teardown
    configfile = backup.configfile
  })

  it('returns just next() if always_ok is 0', () => {
    if (!plugin || !plugin.Syslog) {
      return
    }

    // local setup
    backup.configfile = configfile
    configfile.general.always_ok = 0
    plugin.register()

    plugin.syslog(
      function (action) {
        test.isUndefined(action)
      },
      logger,
      log,
    )
  })

  it('returns next(OK) if always_ok is 1', () => {
    if (!plugin || !plugin.Syslog) {
      return
    }

    // local setup
    backup.configfile = configfile
    configfile.general.always_ok = 1
    plugin.register()

    plugin.syslog(
      function (action) {
        assert.equal(action, constants.OK)
      },
      logger,
      log,
    )

    // local teardown
    configfile = backup.configfile
  })

  it('returns next() if always_ok is random', () => {
    if (!plugin || !plugin.Syslog) {
      return
    }

    // local setup
    backup.configfile = configfile
    configfile.general.always_ok = 'random'
    plugin.register()

    plugin.syslog(
      function (action) {
        test.isUndefined(action)
      },
      logger,
      log,
    )

    // local teardown
    configfile = backup.configfile
  })
})

describe('log', () => {
  beforeEach(_set_up)

  it('syslog hook logs correct thing', () => {
    if (!plugin || !plugin.Syslog) return

    // local setup
    const next = stub()
    backup.plugin.Syslog.log = plugin.Syslog.log
    plugin.Syslog.log = stub()
    plugin.syslog(next, logger, log)

    assert.ok(plugin.Syslog.log.called)
    assert.equal(plugin.Syslog.log.args[0], plugin.Syslog.LOG_INFO)
    assert.equal(plugin.Syslog.log.args[1], log.data)

    // local teardown
    plugin.Syslog.log = backup.plugin.Syslog.log
  })
})
