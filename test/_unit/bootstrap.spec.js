'use strict';
var Sails = require('sails');
var async = require('async');

var testConfig = {
  port: '1350',

  // testing config
  log: {
    level: 'warn'
  },

  models: {
    migrate: 'drop'
  }
};

before(function (done) {
  Sails.lift(testConfig,
    function (err, sails) {
      if (err) {
        return done(err);
      }

      var Session = require('supertest-session')({
        app: sails.hooks.http.app
      });

      // load Fixtures
      sails._request = new Session();

      done(err, sails);
    });
});

after(function (done) {
  Sails.lower(done);
});