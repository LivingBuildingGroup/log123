'use strict';

const path = require('path');
const sys  = require('util');
const fs   = require('fs');

const makeArray = function(nonarray) { 
  return Array.prototype.slice.call(nonarray); 
};

// Create a new instance of Logger, logging to the file at `log_file_path`
// if `log_file_path` is null, log to STDOUT.
const Logger = function(log_file_path) {
  // default write is STDOUT
  // eslint-disable-next-line no-console
  this.write     = console.log;
  this.log_level_index = 3;
  
  // if a path is given, try to write to it
  if (log_file_path) {
    // Write to a file
    log_file_path = path.normalize(log_file_path);
    this.stream = fs.createWriteStream(log_file_path, {flags: 'a', encoding: 'utf8', mode: 666});
    this.stream.write('\n');
    this.write = function(text) { this.stream.write(text); };
  }
};

Logger.levels = ['fatal', 'error', 'warn', 'info', 'debug'];

// The default log formatting function. The default format looks something like:
//
//    error [Sat Jun 12 2010 01:12:05 GMT-0400 (EDT)] message
// 
Logger.prototype.format = function(level, date, message) {
  return [level, ' [', date, '] ', message].join('');
};

// Set the maximum log level. The default level is "info".
Logger.prototype.setLevel = function(new_level) {
  const index = Logger.levels.indexOf(new_level);
  return (index !== -1) ? this.log_level_index = index : false;
};

// The base logging method. If the first argument is one of the levels, it logs
// to that level, otherwise, logs to the default level. Can take `n` arguments
// and joins them by ' '. If the argument is not a string, it runs `sys.inspect()`
// to print a string representation of the object.
Logger.prototype.log = function() {
  const args = makeArray(arguments);
  let log_index = Logger.levels.indexOf(args[0]);
  let message = '';

  // if you're just default logging
  if (log_index === -1) { 
    log_index = this.log_level_index; 
  } else {
    // the first arguement actually was the log level
    args.shift();
  }
  if (log_index <= this.log_level_index) {
    // join the arguments into a loggable string
    args.forEach(function(arg) {
      if (typeof arg === 'string') {
        message += ' ' + arg;
      } else {
        message += ' ' + sys.inspect(arg, false, null);
      }
    });
    message = this.options === 'no-header' ?
      message :
      this.format(Logger.levels[log_index], new Date(), message);
    this.write(message + '\n');
    return message;
  }
  return false;
};

Logger.levels.forEach(function(level) {
  Logger.prototype[level] = function() {
    const args = makeArray(arguments);
    args.unshift(level);
    return this.log.apply(this, args);
  };
});

exports.Logger = Logger;
exports.createLogger = function(log_file_path) {
  return new Logger(log_file_path);
};