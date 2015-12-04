//     _F - a _F thing
//     Copyright (c) 2014, Jayson Harshbarger. (MIT Licensed)
//     https://github.com/Hypercubed/_F

// _F
// -----
// Functional chaining in js.

// (private) For each key in an object
'use strict';

function each(object, fn) {
  Object.keys(object).forEach(function (key) {
    return fn(object[key], key);
  });
}

// (private) Copies from one object to another
function extend(dest, src) {
  each(src, function (value, key) {
    return dest[key] = value;
  });
  return dest;
}

// (private)
function identity(d) {
  return d;
}

// (private)
function exists(d) {
  return d !== undefined && d !== null;
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
  return function () {
    return f.apply(this, arguments);
  };
}

// (private)
function partial(func) {
  var boundArgs = Array.prototype.slice.call(arguments, 1);
  return function () {
    var position = 0;
    var args = boundArgs.slice();
    while (position < arguments.length) args.push(arguments[position++]);
    return func.apply(this, args);
  };
}

// (private) constructs a accessor function based on a key
function prop(key) {
  if (!exists(key)) return identity;
  if (typeof key === 'function') return apply(key);
  if (key === '$index') return function (d, i) {
    return i;
  };
  if (key === '$this') return function () {
    return this;
  };
  // if (typeof key === 'string' && key.match(/^\$\d+$/)) { key = parseInt(key.replace('$')); };
  if (typeof key === 'number') {
    return function (d) {
      return exists(d) ? d[key] : undefined;
    };
  }
  if (typeof key === 'string' && key.indexOf('.') === -1) {
    return function (d) {
      return exists(d) ? d[key] : undefined;
    };
  }

  var chain = Array.isArray(key) ? key : key.split('.');
  var f = prop(chain.shift());
  var g = prop(chain.join('.'));
  return compose(g, f);
}

// (private)
function compose(g, f) {
  return function (d, i, j) {
    return g.call(this, f.apply(this, arguments), i, d);
  };
}

// (private)
function curry2(fn) {
  return function () {
    var args = Array.prototype.slice.apply(arguments);
    return function (a) {
      return fn.apply(this, [a].concat(args));
    };
  };
}

// (private)
function curry5(fn) {
  return function (f, g) {
    return function (a, i, d) {
      return !!fn.call(this, f, g, a, i, d);
    };
  };
}

// Prototype of _F functions
var _proto = {};

// Operators
// -----
// Operators take a value and return a new accessor function
var _proto_ops = {
  /* eslint eqeqeq: 0 */
  eq: function eq(a, v) {
    return a == v;
  },
  is: function is(a, v) {
    return a === v;
  },
  neq: function neq(a, v) {
    return a !== v;
  },
  lt: function lt(a, v) {
    return a < v;
  },
  gt: function gt(a, v) {
    return a > v;
  },
  lte: function lte(a, v) {
    return a <= v;
  },
  gte: function gte(a, v) {
    return a >= v;
  },
  between: function between(a, v, w) {
    return a > v && a < w;
  },
  exists: function exists(a) {
    return a !== undefined && a !== null;
  },
  'typeof': function _typeof(a, v) {
    return typeof a === v;
  },
  match: function match(a, v) {
    return v instanceof RegExp ? v.test(String(a)) : new RegExp(v).test(String(a));
  },
  'in': function _in(a, v) {
    return Array.isArray(v) ? v.indexOf(a) > -1 : String(v).indexOf(String(a)) > -1;
  },
  has: function has(a, v) {
    return Array.isArray(a) ? a.indexOf(v) > -1 : String(a).indexOf(String(v)) > -1;
  }
};

// Chaining functions
// -----
// Chaining functions take a two accessor functions and return a new accessor, returning `true` or `false`
// The second function will not be called if the first returns false
var _proto_chains = {
  and: function and(f, g, a, i, d) {
    return f.call(this, d, i) && g.call(this, d, i);
  },
  or: function or(f, g, a, i, d) {
    return f.call(this, d, i) || g.call(this, d, i);
  },
  not: function not(f, g, a, i, d) {
    return !g.call(this, d, i);
  }
};

/* _proto.chainFn = function(f, _c) {
    if (_c.hasOwnProperty('accessor') && _c.accessor === undefined) {
      _c = factory(this.accessor, _c);
    }
    return f(this, _c);
} */

// function apply(f) {
//  return function() { return f.apply(this, arguments); }
// }

_proto.factory = function (g) {
  return factory(this.accessor, g);
};

_proto._factory = function (g) {
  if (g.hasOwnProperty('accessor') && g.accessor === undefined) {
    return this.factory(g);
  }
  return g;
};

_proto.compose = partial(compose, _proto.factory);

_proto.partial = function () {
  var _fn = partial.apply(this, arguments);
  return partial(_fn, this);
};

_proto.wrap = function (f) {
  var _g = compose(this.partial.apply(this, arguments), this._factory);
  return this.compose(_g);
};

_proto.chain = function (fn) {
  return function () {
    var self = this;
    var _fn = this.wrap(fn);

    if (arguments.length < 1) {
      var f = {};

      each(_proto_ops, function (op, k) {
        f[k] = compose(_fn, self[k]).bind(self);
      });

      return f;
    }

    return _fn.apply(this, arguments);
  };
};

_proto.order = function (comparator) {
  var self = this;

  if (arguments.length < 1) {
    return {
      asc: _proto.order.call(self, ascending),
      desc: _proto.order.call(self, descending)
    };
  }

  return function (a, b) {
    return comparator(self(a), self(b));
  };
};

// Wraps operators in factor generator
each(_proto_ops, function (v, k) {
  _proto[k] = compose(_proto.factory, curry2(v));
});

// Wraps chain functions (and, or, not) and adds to prototype
each(_proto_chains, function (v, o) {
  _proto[o] = _proto.chain(curry5(v));
});

// _F factory
// -----
// This is the exposed function factory
function factory(key, ret) {
  // Factory

  var _accessor = prop(key);
  var _fn;

  // Create base function object
  _fn = typeof ret === 'function' ? compose(ret, _accessor) : _accessor;
  _fn.key = key;
  _fn.accessor = key !== undefined && key !== null ? _accessor : undefined;

  extend(_fn, _proto);

  return _fn;
}

module.exports = factory;