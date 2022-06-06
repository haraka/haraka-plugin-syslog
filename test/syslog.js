'use strict';

const assert = require('assert')

const fixtures     = require('haraka-test-fixtures');
const constants    = require('haraka-constants');

const stub         = fixtures.stub.stub;

const _set_up = function (done) {
  this.backup = { plugin: { Syslog: {} } }

  this.plugin = new fixtures.plugin('syslog');

  // stub out functions
  this.log = stub();
  this.log.level = 'INFO';
  this.log.data = "this is a test log message";

  // some test data
  this.configfile = {
    general : {
      name : 'haraka',
      facility : 'MAIL',
      log_pid : 1,
      log_odelay : 1,
      log_cons : 0,
      log_ndelay : false,
      log_nowait : 'random',
      always_ok : false
    }
  }

  if (this.plugin) {
    this.plugin.config.get = function () {
      return this.configfile;
    }.bind(this);
  }

  done();
}

describe('register', function () {
  beforeEach(_set_up)

  it('should have register function', function (done) {
    if (this.plugin) {
      assert.ok(this.plugin);
      assert.equal(typeof this.plugin.register, 'function');
    }
    done()
  })

  it('register function should call register_hook()', function (done) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      assert.ok(this.plugin.register_hook.called);
    }
    done()
  })

  it('register_hook() should register for proper hook', function (done) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      assert.equal(this.plugin.register_hook.args[0], 'log');
    }
    done()
  })

  it('register_hook() should register available function', function (done) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      assert.equal(this.plugin.register_hook.args[1], 'syslog');
      assert.ok(this.plugin.syslog);
      assert.equal(typeof this.plugin.syslog, 'function');
    }
    done()
  })

  it('register calls Syslog.init()', function (done) {
    // local setup
    if (this.plugin && this.plugin.Syslog) {
      this.backup.plugin.Syslog.init = this.plugin.Syslog.init;
      this.plugin.Syslog.init = stub();
      this.plugin.register();

      assert.ok(this.plugin.Syslog.init.called);
    }
    done()

    // local teardown
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.Syslog.init = this.backup.plugin.Syslog.init;
    }
  })

  it('register calls Syslog.init() with correct args', function (done) {
    // local setup
    if (this.plugin && this.plugin.Syslog) {
      this.backup.plugin.Syslog.init = this.plugin.Syslog.init;
      this.plugin.Syslog.init = stub();
      this.plugin.register();

      assert.ok(this.plugin.Syslog.init.called);
      assert.equal(this.plugin.Syslog.init.args[0],
        this.plugin.config.get("test").general.name);
      assert.equal(this.plugin.Syslog.init.args[1],
        this.plugin.Syslog.LOG_PID | this.plugin.Syslog.LOG_ODELAY);
      assert.equal(this.plugin.Syslog.init.args[2],
        this.plugin.Syslog.LOG_MAIL);
    }
    done()

    // local teardown
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.Syslog.init = this.backup.plugin.Syslog.init;
    }
  })
})

describe('hook', function () {
  beforeEach(_set_up)

  it('returns just next() by default (missing always_ok)', function (done) {
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    const next = function (action) {
      test.isUndefined(action);
      done()
    }

    this.plugin.syslog(next, this.logger, this.log);
  })

  it('returns just next() if always_ok is false', function (done) {
    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'false';
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    this.plugin.register();

    this.plugin.syslog(function (action) {
      test.isUndefined(action);
      done()
    }, this.logger, this.log);
  })

  it('returns next(OK) if always_ok is true', function (done) {
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'true';
    this.plugin.register();

    this.plugin.syslog(function (action) {
      assert.equal(action, constants.OK);
      done()
    }, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  })

  it('returns just next() if always_ok is 0', function (done) {
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 0;
    this.plugin.register();

    this.plugin.syslog(function (action) {
      test.isUndefined(action);
      done()
    }, this.logger, this.log);
  })

  it('returns next(OK) if always_ok is 1', function (done) {
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 1;
    this.plugin.register();

    this.plugin.syslog(function (action) {
      assert.equal(action, constants.OK);
      done()
    }, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  })

  it('returns next() if always_ok is random', function (done) {
    if (!this.plugin || !this.plugin.Syslog) { return done() }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'random';
    this.plugin.register();

    this.plugin.syslog(function (action) {
      test.isUndefined(action);
      done()
    }, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  })
})

describe('log', function () {
  beforeEach(_set_up)

  it('syslog hook logs correct thing', function (done) {
    const plugin = this.plugin;
    if (!plugin || !plugin.Syslog) return done()

    // local setup
    const next = stub();
    this.backup.plugin.Syslog.log = plugin.Syslog.log;
    plugin.Syslog.log = stub();
    plugin.syslog(next, this.logger, this.log);

    assert.ok(plugin.Syslog.log.called);
    assert.equal(plugin.Syslog.log.args[0], plugin.Syslog.LOG_INFO);
    assert.equal(plugin.Syslog.log.args[1], this.log.data);
    done()

    // local teardown
    plugin.Syslog.log = this.backup.plugin.Syslog.log;
  })
})
