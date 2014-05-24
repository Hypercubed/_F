//     _F - a _F thing
//     Copyright (c) 2014, Jayson Harshbarger. (MIT Licensed)
//     https://github.com/Hypercubed/_F

// _F
// -----
// Functional chaining in js.

;(function() {

  // (private) Copies from one object to another
  function extend(dest, src) {
    Object.keys(src).forEach(function(key) {
      dest[key] = src[key];
    });
    return dest;
  }

  // Operators
  // -----
  // Operators take a value and return a new accessor function
  var _proto_ops = {
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

  // Chaining functions
  // -----
  // Chaining functions take a two accessor functions and return a new accessor
  
  var _proto_chains = {
    and: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return !!(fa.call(this,d,i) && fb.call(this,d,i));
      });
    },
    or: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return !!(fa.call(this, d, i) || fb.call(this, d, i));
      });
    },
    not: function(fa,fb) {
      return factory(this.accessor, function(a, i, d) {
        return !fb.call(this, d, i);
      });
    }
  };

  // Prototype of _F functions
  var _proto = extend({}, _proto_ops);

  // Wraps chain functions (and, or, not) and adds to prototype
  Object.keys(_proto_chains).forEach(function(o) {
    _proto[o] = function(_c) {

      if (arguments.length < 1) {
        return extend({}, _proto[o]);
      }

      if (_c.hasOwnProperty('accessor') && _c.accessor === undefined) {
        _c = factory(this.accessor, _c);
      }

      return _proto_chains[o](this, _c);
    };

    // Wraps operators on chain functions (eq, lt, gt) and adds to prototype
    Object.keys(_proto_ops).forEach(function(k) {
      _proto[o][k] = (function(v) {
        var _c = _proto_ops[k].apply(this, arguments);
        return _proto[o].call(this, _c);
      });
    });
  });

  // _F factory
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

    // Wraps operators
    Object.keys(_proto_chains).forEach(function(o) {
      Object.keys(_proto_ops).forEach(function(k) {
        _fn[o][k] = (function(v) {
          var _c = _proto_ops[k].apply(this, arguments);
          return _proto[o].call(this, _c);
        }).bind(_fn);
      });
    });

    return _fn;
  }

  // wrap up for Node.js or the browser
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

// Function.prototype.bind shim
// -----------
// See [phantomjs/issues/10522](https://github.com/ariya/phantomjs/issues/10522).
;(function() {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
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
