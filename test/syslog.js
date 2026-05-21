'use strict'

const assert = require('node:assert/strict')
const path = require('node:path')
const { describe, it, beforeEach } = require('node:test')

const fixtures = require('haraka-test-fixtures')
const constants = require('haraka-constants')

// modern-syslog is a native addon that talks to the system logger. Replace it
// with a recorder that keeps the real numeric LOG_* constants (so the plugin's
// facility/option bit-math stays meaningful) but captures init()/log() calls.
const real = require('modern-syslog')
const calls = { init: [], log: [] }
const fakeSyslog = new Proxy(
  {
    init: (...a) => calls.init.push(a),
    log: (...a) => calls.log.push(a),
  },
  { get: (target, prop) => (prop in target ? target[prop] : real[prop]) },
)
const resolved = require.resolve('modern-syslog', {
  paths: [path.resolve(__dirname, '..')],
})
require.cache[resolved] = {
  id: resolved,
  filename: resolved,
  loaded: true,
  exports: fakeSyslog,
}

const L = real // shorthand for the genuine LOG_* constants

// Build a plugin whose syslog.ini resolves to `general`. Passing no argument
// exercises the real config/syslog.ini shipped with the plugin.
const makePlugin = (general) => {
  const plugin = new fixtures.plugin('syslog')
  if (general) plugin.config.get = () => ({ general })
  return plugin
}

const mkLog = (level, data = 'a test message') => ({ level, data })

beforeEach(() => {
  calls.init.length = 0
  calls.log.length = 0
})

describe('register', () => {
  it('registers the syslog function on the log hook', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    assert.ok(plugin.hooks.log.includes('syslog'))
    assert.equal(typeof plugin.syslog, 'function')
  })

  it('init() gets name, option bitmask, and facility', () => {
    makePlugin({
      name: 'mailer',
      facility: 'MAIL',
      pid: true,
      odelay: true,
    }).register()
    const [name, options, facility] = calls.init.at(-1)
    assert.equal(name, 'mailer')
    assert.equal(options, L.LOG_PID | L.LOG_ODELAY)
    assert.equal(facility, L.LOG_MAIL)
  })

  it('only enabled options are OR-ed into the bitmask', () => {
    makePlugin({ name: 'haraka', facility: 'USER', cons: true }).register()
    const [, options, facility] = calls.init.at(-1)
    assert.equal(options, L.LOG_CONS)
    assert.equal(facility, L.LOG_USER)
  })

  it('no options yields a zero bitmask', () => {
    makePlugin({ name: 'haraka', facility: 'LOCAL7' }).register()
    const [, options, facility] = calls.init.at(-1)
    assert.equal(options, 0)
    assert.equal(facility, L.LOG_LOCAL7)
  })

  it('lower-case facility is upper-cased', () => {
    makePlugin({ name: 'haraka', facility: 'local0' }).register()
    assert.equal(calls.init.at(-1)[2], L.LOG_LOCAL0)
  })

  it('unknown facility falls back to LOG_MAIL', () => {
    makePlugin({ name: 'haraka', facility: 'BOGUS' }).register()
    assert.equal(calls.init.at(-1)[2], L.LOG_MAIL)
  })

  it('missing name defaults to "haraka"', () => {
    makePlugin({ facility: 'MAIL' }).register()
    assert.equal(calls.init.at(-1)[0], 'haraka')
  })

  it('the shipped config/syslog.ini drives init()', () => {
    makePlugin().register() // real config: name=haraka pid/odelay, MAIL
    const [name, options, facility] = calls.init.at(-1)
    assert.equal(name, 'haraka')
    assert.equal(options, L.LOG_PID | L.LOG_ODELAY)
    assert.equal(facility, L.LOG_MAIL)
  })
})

describe('init_syslog (hot reload)', () => {
  it('re-init runs with new cfg and uses the new facility/options', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL', pid: true })
    plugin.register()
    assert.equal(calls.init.length, 1)
    assert.deepEqual(calls.init[0], ['haraka', L.LOG_PID, L.LOG_MAIL])

    // simulate operator editing syslog.ini and the watchCb firing
    plugin.cfg = { general: { name: 'relay', facility: 'LOCAL7', cons: true } }
    plugin.init_syslog()
    assert.equal(calls.init.length, 2)
    assert.deepEqual(calls.init[1], ['relay', L.LOG_CONS, L.LOG_LOCAL7])
  })

  it('register() does not double-init from the nested load_syslog_ini call', () => {
    makePlugin({ name: 'haraka', facility: 'MAIL' }).register()
    assert.equal(calls.init.length, 1, 'init() must run exactly once on register()')
  })
})

describe('load_syslog_ini', () => {
  it('always leaves cfg.general defined', () => {
    const plugin = new fixtures.plugin('syslog')
    plugin.config.get = () => ({})
    plugin.load_syslog_ini()
    assert.deepEqual(plugin.cfg.general, {})
  })

  it('reads the shipped defaults', () => {
    const plugin = new fixtures.plugin('syslog')
    plugin.load_syslog_ini()
    assert.equal(plugin.cfg.general.name, 'haraka')
    assert.equal(plugin.cfg.general.facility, 'MAIL')
    assert.equal(plugin.cfg.general.pid, true)
    assert.equal(plugin.cfg.general.always_ok, false)
  })
})

describe('syslog hook', () => {
  const levelMap = {
    INFO: 'LOG_INFO',
    NOTICE: 'LOG_NOTICE',
    WARN: 'LOG_WARNING',
    ERROR: 'LOG_ERR',
    CRIT: 'LOG_CRIT',
    ALERT: 'LOG_ALERT',
    EMERG: 'LOG_EMERG',
    DATA: 'LOG_DEBUG',
    PROTOCOL: 'LOG_DEBUG',
    DEBUG: 'LOG_DEBUG',
    SOMETHINGELSE: 'LOG_DEBUG', // default branch
  }

  for (const [level, constant] of Object.entries(levelMap)) {
    it(`maps log level ${level} -> ${constant}`, () => {
      const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
      plugin.register()
      let action = 'unset'
      plugin.syslog((a) => (action = a), {}, mkLog(level, 'payload'))
      assert.deepEqual(calls.log.at(-1), [L[constant], 'payload'])
      assert.equal(action, undefined)
    })
  }

  it('lower-case level is upper-cased before mapping', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    plugin.syslog(() => {}, {}, mkLog('warn', 'lc'))
    assert.deepEqual(calls.log.at(-1), [L.LOG_WARNING, 'lc'])
  })

  it('calls next() with no argument when always_ok is unset', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    let called
    plugin.syslog((a) => (called = { a }), {}, mkLog('INFO'))
    assert.deepEqual(called, { a: undefined })
  })

  it('strips control characters from log.data (syslog injection)', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    plugin.syslog(() => {}, {}, mkLog('INFO', 'safe\nattacker\rline\x00\x07end'))
    assert.deepEqual(calls.log.at(-1), [L.LOG_INFO, 'safe attacker line  end'])
  })

  it('preserves TAB in log.data', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    plugin.syslog(() => {}, {}, mkLog('INFO', 'col1\tcol2'))
    assert.deepEqual(calls.log.at(-1), [L.LOG_INFO, 'col1\tcol2'])
  })

  it('tolerates non-string log.data without throwing', () => {
    const plugin = makePlugin({ name: 'haraka', facility: 'MAIL' })
    plugin.register()
    plugin.syslog(() => {}, {}, { level: 'INFO', data: null })
    assert.deepEqual(calls.log.at(-1), [L.LOG_INFO, ''])
  })

  it('calls next(OK) when always_ok is true', () => {
    const plugin = makePlugin({
      name: 'haraka',
      facility: 'MAIL',
      always_ok: true,
    })
    plugin.register()
    let action
    plugin.syslog((a) => (action = a), {}, mkLog('INFO'))
    assert.equal(action, constants.OK)
  })
})
