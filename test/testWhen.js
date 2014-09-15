'use strict';

var when = require("when");
var should = require('should');

describe('test when api', function(){
  it('promise1', function(done) {
    var p1 = when.promise(function(resolve, reject, notify) {
      setTimeout(function() {
        resolve(10);
      },50);
    });
    p1.then(function(val) {
      should.equal(val, 10);
      done();
    });
  });

  it('promise join', function(done) {
    when.join(
      when.promise(function(resolve) {
        setTimeout(function() {resolve(10);});
      }),
      when.promise(function(resolve) {
        setTimeout(function() {resolve(20);});
      })
    ).then(function(val) {
      should(val).eql([10, 20]);
      done();
    });
  });

  it('promise & lift', function(done) {
    var add = function (x,y) { return x+y;};
    var liftedAdd = when.lift(add);
    var promises = [];

    promises.push(when.try(add,
      when.promise(function(resolve) {
        setTimeout(function() {resolve(10);});
      }),
      when.promise(function(resolve) {
        setTimeout(function() {resolve(20);});
      })
    ).then(function(val) {
      should(val).eql(30);
      return val+1;
    }));

    var lPromise = liftedAdd(
      when.promise(function(resolve) {
        setTimeout(function() {resolve(1);});
      }),
      when.promise(function(resolve) {
        setTimeout(function() {resolve(2);});
      })
    );
    
    promises.push(
      lPromise.then(function(val) {
        should(val).eql(3);
        return val+1;
    }));

    when.all(promises).then(function(val) {
      should(val).eql([31,4]);
      done();
    });

  });
});

