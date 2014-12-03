'use strict';
var should = require('chai').should();

describe('MASController', function () {

  describe('random Policy', function () {

    it('should be accessible', function (done) {
      sails._request
        .post('/multiAgentSystem')
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