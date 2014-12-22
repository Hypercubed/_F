//     _F - a _F thing
//     Copyright (c) 2014, Jayson Harshbarger. (MIT Licensed)
//     https://github.com/Hypercubed/_F

// _F
// -----
// Functional chaining in js.

;(function() {
  'use strict';

  // (private)
  function _each(object, fn) {
    R.keys(object).forEach(function(key) {
      fn(object[key], key);
    });
  }

  // (private) Copies from one object to another
  function _extend(destination, other) {
    var props = R.keys(other),
    idx = -1, length = props.length;
    while (++idx < length) {
      destination[props[idx]] = other[props[idx]];
    }
    return destination;
  }

  // (private)
  function _curry2(fn) {
    return function(a, b) {
      switch (arguments.length) {
        case 0:
          throw _noArgsException();
        case 1:
          return function(b) {
            return fn(a, b);
          };
        default:
          return fn(a, b);
      }
    };
  }

  var R;

  try {
    R = require('ramda');
  } catch(err) {

  }

  if (!R) {

    R = {};

    R.keys = Object.keys;

    R.identity = function identity(d) {
      return d;
    };

    R.lPartial = function partial(func) {
      var boundArgs = Array.prototype.slice.call(arguments, 1);
      return function() {
        var position = 0;
        var args = boundArgs.slice();
        while (position < arguments.length) args.push(arguments[position++]);
        return func.apply(this, args);
      };
    };

    R.prop = function prop(p, obj) {
      if (arguments.length === 1) {
        return function _prop(obj) { return obj[p]; };
      }
      return obj[p];
    };

    R.type = function type(val) {
      return val === null      ? 'Null'      :
             val === undefined ? 'Undefined' :
             toString.call(val).slice(8, -1);
    };

    R.compose = function _compose(g, f) {
      return function() {
        return g.call(this, f.apply(this, arguments));
      };
    };

    R.and = function and(f, g) {
      return function _and() {
        return f.apply(this, arguments) && g.apply(this, arguments);
      };
    };

    R.or = function(f, g) {
      return function _or() {
        return f.apply(this,arguments) || g.apply(this,arguments);
      };
    };

    R.not = function(g) {
      return function _not() {
        return !g.apply(this,arguments);
      };
    };

    R.arity = function(n, fn) {
      //switch (n) {
        //case 0: return function() {return fn.apply(this, arguments);};
        //case 1:
          return function(a0) {void a0; return fn.apply(this, arguments);};
        //case 2: return function(a0, a1) {void a1; return fn.apply(this, arguments);};
        //case 3: return function(a0, a1, a2) {void a2; return fn.apply(this, arguments);};
        //case 4: return function(a0, a1, a2, a3) {void a3; return fn.apply(this, arguments);};
        //case 5: return function(a0, a1, a2, a3, a4) {void a4; return fn.apply(this, arguments);};
        //case 6: return function(a0, a1, a2, a3, a4, a5) {void a5; return fn.apply(this, arguments);};
        //case 7: return function(a0, a1, a2, a3, a4, a5, a6) {void a6; return fn.apply(this, arguments);};
        //case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) {void a7; return fn.apply(this, arguments);};
        //case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) {void a8; return fn.apply(this, arguments);};
        //case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) {void a9; return fn.apply(this, arguments);};
        //default: return fn; // TODO: or throw?
      //}
    };

    R.bind = function bind(fn, thisObj) {
      return function() {
        return fn.apply(thisObj, arguments);
      };
    };

  }

  // (private)
  function exists(d) {
    return d !== undefined && d !== null;
  }

  // (private)
  function ascending(a, b) {  // R.comparator(R.lt)
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  // (private)
  function descending(a, b) {  // R.comparator(R.gt)
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  // (private)
  function rcompose ( g, f ){
    return function ( d, i, j ){
      return g.call(this, f.apply(this, arguments), i, d);
    };
  }

  // (private) Like curry, but last argument is first
  function rcurry(fn) {
    return function() {
      var vArgs = Array.prototype.slice.call(arguments);
      return function(a) {
        return fn.apply(this, [a].concat(vArgs));
      };
    };
  }

  function _flip(fn) {
    return function _flipped() {
      var args =　Array.prototype.slice.call(arguments);
      return fn.apply(this, args.reverse());
    };
  }

  // (private)
  function flip(fn) {
    return function() {
      var _fn = fn.apply(this,arguments);
      return _flip(_fn);
    };
  }

  var _prop = function prop(p, obj) {
    if (arguments.length === 1) {
      return function _prop(d) { return exists(d) ? d[p] : undefined; };
    }
    return obj[p];
  };


  // (private) constructs a accessor function based on a key
  function prop(key) {
    if (!exists(key)) return R.identity;
    if (typeof key === 'function') return R.arity(1,key);
    if (key === '$index') return function(d, i) { return i; };
    if (key === '$this') return function() { return this; };
    if (typeof key === 'number') { return _prop(key); }
    if (typeof key === 'string' && key.indexOf('.') === -1 ) { return _prop(key); }

    var chain = (Array.isArray(key)) ? key : key.split('.');
    var f = prop(chain.shift());
    var g = prop(chain.join('.'));
    return R.compose(g,f);
  }

  // Prototype of _F functions
  var _proto = {};

  // Operators
  // -----
  // Operators take a value and return a new accessor function
  var _proto_ops = {
    eq:       function(a,v)   { return a  == v; },
    is:       function(a,v)   { return a === v; },
    neq:      function(a,v)   { return a !== v; },
    lt:       function(a,v)   { return a  <  v; },
    gt:       function(a,v)   { return a  >  v; },
    lte:      function(a,v)   { return a  <= v; },
    gte:      function(a,v)   { return a  >= v; },
    between:  function(a,v,w) { return a > v && a < w; },
    exists:   function(a)     { return a !== undefined && a !== null; },
    typeof:   function(a,v)   { return R.type(a).toLowerCase() === v; },
    match:    function(a,v)   { return (v instanceof RegExp) ? v.test(String(a)) : (new RegExp(v)).test(String(a)); },
    in:       function(a,v)   { return (Array.isArray(v)) ? v.indexOf(a) > -1 : String(v).indexOf(String(a)) > -1; },
    has:      function(a,v)   { return (Array.isArray(a)) ? a.indexOf(v) > -1 : String(a).indexOf(String(v)) > -1; }
  };

  // Chaining functions
  // -----
  // Chaining functions take a two accessor functions and return a new accessor, returning `true` or `false`
  // The second function will not be called if the first returns false
  var _proto_chains = {
    and: R.and,
    or: R.or,
    not: function(f, g) {
      return R.not(g);
    }
  };

  _proto.factory = function(g) {
    return factory(this.accessor, g);
  };

  _proto._factory = function(g) {
    if (g.hasOwnProperty('accessor') && g.accessor === undefined) {
      return this.factory(g);
    }
    return g;
  };

  _proto.wrap = function(f) {
    var _f = R.lPartial(flip(f),this);
    var _g = R.compose(_f, this._factory);
    return R.compose(_proto.factory, _g);
  };

  _proto.chain = function(fn) {
    return function() {
      var self = this;
      var _fn = this.wrap(fn);

      if (arguments.length < 1) {
        var f = {};

        _each(_proto_ops, function(op,k) {
          f[k] = R.bind(R.compose(_fn, self[k]),self);
        });

        return f;
      }

      return _fn.apply(this,arguments);
    };
  };

  _proto.order = function(pred) {
    var self = this;

    if (arguments.length < 1) {
      return {
        asc: _proto.order.call(self, ascending),
        desc: _proto.order.call(self, descending),
      };
    }

    return function(a,b) {
      return pred(self(a),self(b));
    };

  };

  // Wraps operators in factor generator
  _each(_proto_ops, function(v,k) {
    _proto[k] = R.compose(_proto.factory, rcurry(v));
  });

  // Wraps chain functions (and, or, not) and adds to prototype
  _each(_proto_chains, function(v,o) {
    _proto[o] = _proto.chain(v);
  });

  // _F factory
  // -----
  // This is the exposed function factory
  function factory(key, ret) { // Factory

    var _accessor = prop(key),
        _fn;

    // Create base function object
    _fn = (typeof ret === 'function') ? rcompose(ret, _accessor) : _accessor;
    _fn.key = key;
    _fn.accessor = exists(key) ? _accessor : undefined;

    return _extend(_fn, _proto);

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
