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

  // Prototype of _F functions
  var _proto = {};

  // Operators
  // -----
  // Operators take a value and return a new accessor function
  var _proto_ops = {
    eq: function(v) {
      return function(a) {return a == v;};
    },
    lt: function(v) {
      return function(a) {return a < v;};
    },
    gt: function(v) {
      return function(a) {return a > v;};
    },
    lte: function(v) {
      return function(a) {return a <= v;};
    },    
    gte: function(v) {
      return function(a) {return a >= v;};
    }//,
    //match: function(v) {  // TODO: test
    //  return factory(this.accessor, function(a) { return a.match(v);});
    //},
    //prop: function(v) {  // TODO: test
    //  return factory(this.accessor, function(a) { return a[v];});
    //},
  };

  // Chaining functions
  // -----
  // Chaining functions take a two accessor functions and return a new accessor, returning `true` or `false`
  // The second function will not be call if the first returns false
  var _proto_chains = {
    and: function(f,g) {
      return function(a, i, d) {
        return !!(f.call(this,d,i) && g.call(this,d,i));
      };
    },
    or: function(f,g) {
      return function(a, i, d) {
        return !!(f.call(this, d, i) || g.call(this, d, i));
      };
    },
    not: function(f,g) {
      return function(a, i, d) {
        return !g.call(this, d, i);
      };
    }
  };

  /* _proto.chainFn = function(f, _c) {
      if (_c.hasOwnProperty('accessor') && _c.accessor === undefined) {
        _c = factory(this.accessor, _c);
      }
      return f(this, _c);
  } */

  var _wrap_op = function(_fn) {
    return function() {
      var fn = _fn.apply(this, arguments);
      return factory(this.accessor, fn);
    }
  }

  var _wrap_chain = function(_fn) {
    return function(g) {
      if (g.hasOwnProperty('accessor') && g.accessor === undefined) {
        g = factory(this.accessor, g);
      }
      var fn = _fn.call(this, this, g);
      return factory(this.accessor, fn);
    }
  }

  // Wraps operators in factor generator
  Object.keys(_proto_ops).forEach(function(k) {
    _proto[k] = _wrap_op(_proto_ops[k]);
  });

  // Wraps chain functions (and, or, not) and adds to prototype
  Object.keys(_proto_chains).forEach(function(o) {
    var _wrapped = _wrap_chain(_proto_chains[o]);

    _proto[o] = function(g) {
      var self = this;

      if (arguments.length < 1) {
        var f = {};

        Object.keys(_proto_ops).forEach(function(k) {
          f[k] = (function() {
            var _c = self[k].apply(this, arguments);
            return self[o].call(self, _c);
          });
        });

        return f;
      }
      return _wrapped.call(this,g);
    }

    //_proto[o] = _wrap_chain(_proto_chains[o]);

    // Wraps operators on chain functions (eq, lt, gt) and adds to prototype
    //Object.keys(_proto_ops).forEach(function(k) {
    //  _proto[o][k] = function(v) {
    //    var _c = _wrap_op(_proto_ops[k])(v);
    //    return _wrapped(_c);
    //  };
    //});

  });

  // _F factory
  function factory(key, ret) { // Factory

    var _accessor = key,
        _fn;

    if ((key !== 0 && !key) || key === undefined) _accessor = function(d) { return d; };
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

    // Wraps chained operators.... this is bad!!!
    //Object.keys(_proto_chains).forEach(function(o) {
    //  Object.keys(_proto_ops).forEach(function(k) {
    //    _fn[o][k] = (function(v) {
    //      var _c = _proto[k].apply(this, arguments)
    //      return _proto[o].call(this, _c);
    //    }).bind(_fn);
    //  });
    //});

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
