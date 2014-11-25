//     _F - a _F thing
//     Copyright (c) 2014, Jayson Harshbarger. (MIT Licensed)
//     https://github.com/Hypercubed/_F

// _F
// -----
// Functional chaining in js.

;(function() {
  'use strict';

  // (private) For each key in an object
  function each(object, fn) {
    Object.keys(object).forEach(function(key) {
      fn(object[key], key);
    });
  }

  // (private) Copies from one object to another
  function extend(dest, src) {
    each(src, function(value, key) {
      dest[key] = value;
    });
    return dest;
  }

  // (private)
  function identity(d) {
    return d;
  }

  // (private)
  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  // (private)
  function descending(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  // (private)
  function apply(f) {
    return function() { return f.apply(this, arguments); };
  }

  // (private)
  function partial(func) {
    var boundArgs = Array.prototype.slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  }

  // (private) constructs a accessor function based on a key
  function prop(key) {
    if (key === undefined || key === null) return identity;
    if (typeof key === 'function') return apply(key);
    if (key === '$index') return function(d, i) { return i; };
    if (key === '$this') return function() { return this; };
    //if (typeof key === 'string' && key.match(/^\$\d+$/)) { key = parseInt(key.replace('$')); };
    if (typeof key === 'number' || !key.match(/\./)) {return function(d) { return (d === null || d === undefined) ? undefined : d[key]; };}

    var chain = key.split('.');
    var f = prop(chain.shift());
    var g = prop(chain.join('.'));
    return compose ( g, f );
  }

  // (private)
  function compose ( g, f ){
    return function ( d, i, j ){
      return g.call(this, f.apply(this, arguments), i, d);
    };
  }

  // (private)
  function curry2(fn) {
    return function(v) {
      return function(a) {
        return fn(a, v);
      };
    };
  }

  // (private)
  function curry5(fn) {
    return function(f,g) {
      return function(a, i, d) {
        return !!fn.call(this,f, g, a, i, d);
      };
    }
  }

  // Prototype of _F functions
  var _proto = {};

  // Operators
  // -----
  // Operators take a value and return a new accessor function
  var _proto_ops = {
    eq:    function(a,v) { return a  == v; },
    neq:   function(a,v) { return a !== v; },
    lt:    function(a,v) { return a  <  v; },
    gt:    function(a,v) { return a  >  v; },
    lte:   function(a,v) { return a  <= v; },
    gte:   function(a,v) { return a  >= v; },
    match: function(a,v) { return (v instanceof RegExp) ? v.test(String(a)) : (new RegExp(v)).test(String(a)); },
    in:    function(a,v) { return (Array.isArray(v)) ? v.indexOf(a) > -1 : String(v).indexOf(String(a)) > -1; },
    has:   function(a,v) { return (Array.isArray(a)) ? a.indexOf(v) > -1 : String(a).indexOf(String(v)) > -1; }
  };

  // Chaining functions
  // -----
  // Chaining functions take a two accessor functions and return a new accessor, returning `true` or `false`
  // The second function will not be called if the first returns false
  var _proto_chains = {
    and: function(f, g, a, i, d) {
      return f.call(this,d,i) && g.call(this,d,i);
    },
    or:  function(f, g, a, i, d) {
      return f.call(this, d, i) || g.call(this, d, i);
    },
    not: function(f, g, a, i, d) {
      return !g.call(this, d, i);
    }
  };

  /* _proto.chainFn = function(f, _c) {
      if (_c.hasOwnProperty('accessor') && _c.accessor === undefined) {
        _c = factory(this.accessor, _c);
      }
      return f(this, _c);
  } */


  //function apply(f) {
  //  return function() { return f.apply(this, arguments); }
  //}

  _proto.factory = function(g) {
    return factory(this.accessor, g);
  };

  _proto._factory = function(g) {
    if (g.hasOwnProperty('accessor') && g.accessor === undefined) {
      return this.factory(g);
    }
    return g;
  };

  _proto.compose = partial(compose, _proto.factory);

  _proto.partial = function() {
    var _fn = partial.apply(this,arguments);
    return partial(_fn, this);
  };

  _proto.wrap = function(f) {
    var _g = compose(this.partial.apply(this,arguments), this._factory);
    return this.compose(_g);
  };

  _proto.chain = function(fn) {
    return function() {
      var self = this;
      var _fn = this.wrap(fn);

      if (arguments.length < 1) {
        var f = {};

        each(_proto_ops, function(op,k) {
          f[k] = compose(_fn, self[k]).bind(self);
        });

        return f;
      }

      return _fn.apply(this,arguments);
    };
  };

  _proto.order = function(comparator) {
    var self = this;

    if (arguments.length < 1) {
      return {
        asc: _proto.order.call(self, ascending),
        desc: _proto.order.call(self, descending),
      };
    }

    return function(a,b) {
      return comparator(self(a),self(b));
    };

  };

  // Wraps operators in factor generator
  each(_proto_ops, function(v,k) {
    _proto[k] = compose(_proto.factory, curry2(v));
  });

  // Wraps chain functions (and, or, not) and adds to prototype
  each(_proto_chains, function(v,o) {
    _proto[o] = _proto.chain(curry5(v));
  });

  // _F factory
  // -----
  // This is the exposed function factory
  function factory(key, ret) { // Factory

    var _accessor = prop(key),
        _fn;

    // Create base function object
    _fn = (typeof ret === 'function') ? compose(ret, _accessor) : _accessor;
    _fn.key = key;
    _fn.accessor = (key) ? _accessor : undefined;

    extend(_fn, _proto);

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
