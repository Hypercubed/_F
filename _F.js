/**
 * _F - a _F thing
 * Copyright (c) 2014, Jayson Harshbarger. (MIT Licensed)
 * https://github.com/Hypercubed/_F
 */

/*
 * _F 0.0.0
 * (c) 2014 J. Harshbarger
 * Licensed MIT
 */
;(function() {
  if (!Function.prototype.bind) {  // https://github.com/ariya/phantomjs/issues/10522
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      var aArgs = Array.prototype.slice.call(arguments, 1), 
          fToBind = this, 
          fNOP = function () {},
          fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                                 aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
})();

;(function() {

  var CHAINS = {
    and: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return fa.call(this,d,i) && fb.call(this,d,i);
      });
    },
    or: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return fa.call(this, d, i) || fb.call(this, d, i);
      });
    },
    not: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return !fb.call(this, d, i);
      });
    }
  };

  var OPS = {
    eq: function(v) {
      return factory(this.accessor, function(a) {return a == v;});
    },
    lt: function(v) {
      return factory(this.accessor, function(a) {return a < v;});
    },
    gt: function(v) {
      return factory(this.accessor, function(a) {return a > v;});
    }
  };

  function extend(dest, src) {
    Object.keys(src).forEach(function(key) {
      dest[key] = src[key];
    });
    return dest;
  }

  var _proto = extend({}, OPS);

  Object.keys(CHAINS).forEach(function(o) {
    var _chain = _proto[o] = function(_c) {

      if (arguments.length < 1) {
        return extend({}, _proto[o]);
      }

      if (_c.hasOwnProperty('accessor') && _c.accessor === undefined) {
        _c = factory(this.accessor, _c);
      }

      return CHAINS[o](this, _c);
    };

    Object.keys(OPS).forEach(function(k) {
      _chain[k] = (function(v) {
        var _c = OPS[k].apply(this, arguments);
        return _chain.call(this, _c);
      });
    });
  });

  function factory(key, ret) { // Factory

    var _accessor = key,
        _fn;

    if (!key || key === undefined) _accessor = function(d) { return d; };
    if (key === '$index') _accessor = function(d, i) { return i; };
    if (key === '$this') _accessor = function(d, i) { return this; };
    if (typeof _accessor !== 'function') _accessor = function(d) { return d[key]; };

    // Create base function object
    if (typeof ret === 'function') {
      _fn = function(d, i, j) {
        return ret.call(this, _accessor.apply(this, arguments), i, d);
      };
    } else {
      _fn = _accessor;
    }

    _fn.key = key;
    _fn.accessor = (key) ? _accessor : undefined;

    extend(_fn, _proto);

    Object.keys(CHAINS).forEach(function(o) {
      Object.keys(OPS).forEach(function(k) {
        _fn[o][k] = (function(v) {
          var _c = OPS[k].apply(this, arguments);
          return _proto[o].call(this, _c);
        }).bind(_fn);
      });
    });

    return _fn;
  }

  if (typeof module !== 'undefined' && typeof exports === 'object') {
    module.exports = factory;
  } else if (typeof define === 'function' && define.amd) {
    define(function() {
      return factory;
    });
  } else {
    this._F = factory;
  }

}).call(function() {
  return this || (typeof window !== 'undefined' ? window : global);
}());