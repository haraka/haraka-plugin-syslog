[![Build Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]
[![Greenkeeper badge][gk-img]](https://greenkeeper.io/)
[![NPM][npm-img]][npm-url]
<!--[![Code Coverage][cov-img]][cov-url]-->

# haraka-plugin-syslog

Adds syslog support to Haraka.  Most log levels in haraka already map to valid
levels in syslog.  Additional log levels in haraka fall under the DEBUG syslog
level.

# Enable

add syslog to config/plugins, near the top of the file.

## Configuration

`config/syslog.ini` is the configuration file for the syslog plugin.
In it you can find ways to customize the syslog service name, set the
logging facility, and set any syslog options you wish. For example:

```
[general]
name=SomeOtherName
```

Sane defaults are chosen for you.

* syslog.general.name (default: haraka)

  The service name to show up in the logs.


* syslog.general.facility (default: MAIL)

  The syslog logging facility to use.  MAIL makes the most sense, but some
  default syslog configs may try to do something special with this log level.
  FreeBSD and OSX, for example, does not log all messages sent to this log
  level to the same file.
  Valid options are:
      MAIL
      KERN
      USER
      DAEMON
      AUTH
      SYSLOG
      LPR
      NEWS
      UUCP
      LOCAL0 ... LOCAL7

* syslog.general.pid (default: 1)

  Option to put the PID in the log message.


* syslog.general.odelay (default: 1)

  Option to open the connection on the first log message.


* syslog.general.ndelay (default: 0)

    Option to open the connection immediately.


* syslog.general.cons (default: 0)

    Option to write directly to system console if there is an error
    while sending to system logger.


* syslog.general.nowait (default: 0)

    Don't wait for child processes that may have been created while
    logging the message.


* syslog.general.always\_ok (default: false)

    If false, then this plugin will return with just next() allowing other
    plugins that have registered for the log hook to run.  To speed things up,
    if no other log hooks need to run (daemon), then one can make this true.
    This will case the plugin to always call next(OK).


[ci-img]: https://travis-ci.org/haraka/haraka-plugin-syslog.svg
[ci-url]: https://travis-ci.org/haraka/haraka-plugin-syslog
[cov-img]: https://codecov.io/github/haraka/haraka-plugin-syslog/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-plugin-syslog
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-syslog/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-syslog
[npm-img]: https://nodei.co/npm/haraka-plugin-syslog.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-syslog
[gk-img]: https://badges.greenkeeper.io/haraka/haraka-plugin-syslog.svg
