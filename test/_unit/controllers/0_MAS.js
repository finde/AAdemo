'use strict';
var should = require('chai').should();

describe('MASController', function () {

  describe('random Policy', function () {

    it('should run until terminal', function (done) {
      sails._request
        .post('/multiAgentSystem/randomPolicy')
        .expect(200)
        .end(function (err, res) {

          var json = res.body;

          should.exist(json);
          console.log(json);
//          json.should.have.property('err')
//            .equal('invalid login');

          done();
        });
    });
  });

  describe('minimaxQ', function () {

    it('should run until terminal', function (done) {
      sails._request
        .post('/multiAgentSystem/minimaxQ')
        .expect(200)
        .end(function (err, res) {

          var json = res.body;

          should.exist(json);
//          json.should.have.property('err')
//            .equal('invalid login');

          done();
        });
    });
  });

  describe('Qlearning', function () {

    it('should run until terminal', function (done) {
      sails._request
        .post('/multiAgentSystem/qlearning')
        .expect(200)
        .end(function (err, res) {

          var json = res.body;

          should.exist(json);
//          json.should.have.property('err')
//            .equal('invalid login');

          done();
        });
    });
  });
});