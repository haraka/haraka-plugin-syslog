'use strict';

var fixtures     = require('haraka-test-fixtures');
var constants    = require('haraka-constants');

var stub         = fixtures.stub.stub;

var _set_up = function (done) {
  this.backup = { plugin: { Syslog: {} } };

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
  };

  if (this.plugin) {
    this.plugin.config.get = function () {
      return this.configfile;
    }.bind(this);
  }

  done();
};

exports.register = {
  setUp : _set_up,
  'should have register function' : function (test) {
    if (this.plugin) {
      test.expect(2);
      test.ok(this.plugin);
      test.equals(typeof this.plugin.register, 'function');
    }
    test.done();
  },
  'register function should call register_hook()' : function (test) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      test.expect(1);
      test.ok(this.plugin.register_hook.called);
    }
    test.done();
  },
  'register_hook() should register for proper hook' : function (test) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      test.expect(1);
      test.equals(this.plugin.register_hook.args[0], 'log');
    }
    test.done();
  },
  'register_hook() should register available function' : function (test) {
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.register();
      test.expect(3);
      test.equals(this.plugin.register_hook.args[1], 'syslog');
      test.ok(this.plugin.syslog);
      test.equals(typeof this.plugin.syslog, 'function');
    }
    test.done();
  },
  'register calls Syslog.init()' : function (test) {
    // local setup
    if (this.plugin && this.plugin.Syslog) {
      this.backup.plugin.Syslog.init = this.plugin.Syslog.init;
      this.plugin.Syslog.init = stub();
      this.plugin.register();

      test.expect(1);
      test.ok(this.plugin.Syslog.init.called);
    }
    test.done();

    // local teardown
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.Syslog.init = this.backup.plugin.Syslog.init;
    }
  },
  'register calls Syslog.init() with correct args' : function (test) {
    // local setup
    if (this.plugin && this.plugin.Syslog) {
      this.backup.plugin.Syslog.init = this.plugin.Syslog.init;
      this.plugin.Syslog.init = stub();
      this.plugin.register();

      test.expect(4);
      test.ok(this.plugin.Syslog.init.called);
      test.equals(this.plugin.Syslog.init.args[0],
        this.plugin.config.get("test").general.name);
      test.equals(this.plugin.Syslog.init.args[1],
        this.plugin.Syslog.LOG_PID | this.plugin.Syslog.LOG_ODELAY);
      test.equals(this.plugin.Syslog.init.args[2],
        this.plugin.Syslog.LOG_MAIL);
    }
    test.done();

    // local teardown
    if (this.plugin && this.plugin.Syslog) {
      this.plugin.Syslog.init = this.backup.plugin.Syslog.init;
    }
  },
};

exports.hook = {
  setUp : _set_up,
  'returns just next() by default (missing always_ok)' : function (test) {
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    var next = function (action) {
      test.expect(1);
      test.isUndefined(action);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);
  },
  'returns just next() if always_ok is false' : function (test) {
    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'false';
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    this.plugin.register();

    var next = function (action) {
      test.expect(1);
      test.isUndefined(action);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);
  },
  'returns next(OK) if always_ok is true' : function (test) {
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'true';
    this.plugin.register();

    var next = function (action) {
      test.expect(1);
      test.equals(action, constants.OK);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  },
  'returns just next() if always_ok is 0' : function (test) {
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 0;
    this.plugin.register();

    var next = function (action) {
      test.expect(1);
      test.isUndefined(action);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);
  },
  'returns next(OK) if always_ok is 1' : function (test) {
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 1;
    this.plugin.register();

    var next = function (action) {
      test.expect(1);
      test.equals(action, constants.OK);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  },
  'returns next() if always_ok is random' : function (test) {
    if (!this.plugin || !this.plugin.Syslog) { return test.done(); }

    // local setup
    this.backup.configfile = this.configfile;
    this.configfile.general.always_ok = 'random';
    this.plugin.register();

    var next = function (action) {
      test.expect(1);
      test.isUndefined(action);
      test.done();
    };

    this.plugin.syslog(next, this.logger, this.log);

    // local teardown
    this.configfile = this.backup.configfile;
  },
};

exports.log = {
  setUp : _set_up,
  'syslog hook logs correct thing' : function (test) {
    let plugin = this.plugin;
    if (!plugin || !plugin.Syslog) return test.done();

    // local setup
    var next = stub();
    this.backup.plugin.Syslog.log = plugin.Syslog.log;
    plugin.Syslog.log = stub();
    plugin.syslog(next, this.logger, this.log);

    test.expect(3);
    test.ok(plugin.Syslog.log.called);
    test.equals(plugin.Syslog.log.args[0], plugin.Syslog.LOG_INFO);
    test.equals(plugin.Syslog.log.args[1], this.log.data);
    test.done();

    // local teardown
    plugin.Syslog.log = this.backup.plugin.Syslog.log;
  }
};
