import test from 'tape';

import _F from '../src/_F';

var rows = [
  [1977, 0],      // 0
  [1978, 0],
  [1979, 0],
  [1980, 43.7],
  [1981, 38.47],
  [1982, 26.87],
  [1983, 21.16],
  [1984, 14.88],
  [1985, 11.31],
  [1986, 13.51],
  [1987, 12.99],  // 10
  [1988, 13.13],
  [1989, 13.84],
  [1990, 8.89],
  [1991, 8.89],
  [1992, 5.65],
  [1993, 3.06],
  [1994, 3.35],
  [1995, 6.04],
  [1996, 6.32],
  [1997, 5.64],  // 20
  [1998, 4.71],
  [1999, 4.61],
  [2000, 3.96],
  [2001, 2.64],
  [2002, 2.34],
  [2003, 2],
  [2004, 2.28],
  [2005, 2.69]  // 28
];

var data = rows.map(function (d) {
  return {
    year: +d[0],
    value: +d[1]
  };
});

var newDate = function (d) {
  newDate.called++;
  return +d;
};

function d3_number (x) {
  return x !== null && !isNaN(x);
}

function d3_mean (array, f) {
  var s = 0;
  var n = array.length;
  var a;
  var i = -1;
  var j = n;
  if (arguments.length === 1) {
    while (++i < n) if (d3_number(a = array[i])) s += a; else --j;
  } else {
    while (++i < n) if (d3_number(a = f.call(array, array[i], i))) s += a; else --j;
  }
  return j ? s / j : undefined;
}

test('_F', (t) => {
  t.test('example', function (t) {
    t.test('should run', function (t) {
      var people = [
        { firstname: 'John', lastname: 'Smith', age: 51 },
        { firstname: 'John', lastname: 'Hawley', age: 16 },
        { firstname: 'Janet', lastname: 'Howell', age: 23 },
        { firstname: 'John', lastname: 'Jones', age: 29 },
        { firstname: 'John', lastname: 'Hernandez', age: 22 },
        { firstname: 'Maurice', lastname: 'Hall', age: 22 }
      ];

      var _firstname = _F('firstname');
      var _age = _F('age');
      var _johns = _firstname.eq('John');
      var _twenties = _age.gte(20).and().lt(30);

      t.deepEqual(people.map(_firstname), ['John', 'John', 'Janet', 'John', 'John', 'Maurice']);  // Returns a list of first names
      t.equal(people.filter(_johns).length, 4);  // returns a list of John's
      t.equal(people.filter(_johns.and(_twenties)).length, 2);  // returns a list of people in their twenties

      var f = people.filter(_johns.and(_twenties)).sort(_age.order().asc);  // returns a list of John's in their twenties sorted by age
      t.equal(f.length, 2);
      t.equal(f[0].age, 22);
      t.equal(f[1].age, 29);

      t.end();
    });
  });

  t.test('_F()', function (t) {
    t.test('should be a function', function (t) {
      t.equal(typeof _F, 'function');
      t.equal(typeof _F(), 'function');
      t.end();
    });

    t.test('should return identity function', function (t) {
      var f = _F();
      t.equal(f(5), 5);
      t.end();
    });

    t.test('should return identity function when passsed null', function (t) {
      var f = _F(null);
      t.equal(f(5), 5);
      t.end();
    });

    t.test('should return an accessor function', function (t) {
      var f = _F('year');
      t.equal(f(data[0]), 1977);
      t.end();
    });

    t.test('should return an index accessor function', function (t) {
      var F = _F('$index');

      t.equal(data.map(F).length, data.length);
      t.equal(data.map(F)[0], 0);
      t.equal(data.map(F)[5], 5);
      t.end();
    });

    t.test('should have access to this', function (t) {
      var F = _F(function (d) {
        return this.name;
      });

      var _this = { name: 'thisName' };
      t.equal(data.map(F, _this).length, data.length);

      t.equal(data.map(F, _this)[0], 'thisName');
      t.equal(data.map(F, _this)[5], 'thisName');
      t.end();
    });

    t.test('should return a this accessor function', function (t) {
      var F = _F('$this');

      var _this = { name: 'thisName' };
      t.equal(data.map(F, _this)[0], _this);
      t.equal(data.map(F, _this)[5], _this);
      t.end();
    });

    t.test('should work with nested data', function (t) {
      var data = { 'date': { 'year': 1990 } };
      var f = _F('date', _F('year'));
      t.equal(f(data), data.date.year);
      t.end();
    });

    t.test('should work with nested data, with chained keys', function (t) {
      var data = { 'date': { 'year': 1990 } };
      t.equal(_F('date.year')(data), data.date.year);
      t.end();
    });

    t.test('should work with nested data, with chained keys in array', function (t) {
      var data = { 'date': { 'year': 1990 } };
      t.equal(_F(['date', 'year'])(data), data.date.year);
      t.end();
    });

    t.test('should return undefined with missing key', function (t) {
      var data = { 'date': { 'year': 1990 } };
      t.equal(_F('year')(data), undefined);
      t.equal(_F('date.day')(data), undefined);
      t.equal(_F('year.day')(data), undefined);
      t.equal(_F('date.year.value')(data), undefined);
      t.end();
    });

    t.test('should work with numeric keys', function (t) {
      var _secondElement = _F(1);
      t.equal(_secondElement([1978, 0]), 0);
      t.deepEqual(_secondElement(rows), [1978, 0]);
      t.equal(_secondElement.eq(rows[0])(rows), false);
      t.equal(_secondElement.eq(rows[1])(rows), true);
      t.end();
    });

    t.test('should work with numeric keys, including zero', function (t) {
      var _firstElement = _F(0);
      t.equal(_firstElement([1977, 0]), 1977);
      t.deepEqual(_firstElement(rows), [1977, 0]);
      t.equal(_firstElement.eq(1977)([1977, 0]), true);
      t.equal(_firstElement.eq(0)([1977, 0]), false);
      t.end();
    });
  });

  t.test('#is', function (t) {
    t.test('should work', function (t) {
      var a = [1, 2];
      var b = [1, 2];

      var f = _F().is(a);
      t.equal(f(a), true);
      t.equal(f(b), false);
      t.end();
    });
  });

  t.test('#eq', function (t) {
    t.test('should work', function (t) {
      var f = _F('year').eq(1977);

      t.equal(f(data[0]), true);
      t.equal(f(data[1]), false);
      t.equal(data.filter(f).length, 1);
      t.end();
    });

    t.test('should not interfere', function (t) {
      var f = _F('year').eq(1977);

      t.equal(f(data[0]), true);
      t.equal(f(data[1]), false);
      t.equal(data.filter(f).length, 1);
      t.end();
    });
  });

  t.test('#lt', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').lt(newDate(1990));

      t.equal(f(data[0]), true);
      t.equal(data.filter(f).length, 13);
      t.end();
    });

    t.test('should work with $index', function (t) {
      var F = _F('$index').lt(10);

      t.equal(data.filter(F).length, 10);
      t.equal(data.filter(F)[9], data[9]);
      t.end();
    });
  });

  t.test('#lte', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').lte(newDate(1989));

      t.equal(f(data[0]), true);
      t.equal(data.filter(f).length, 13);
      t.end();
    });

    t.test('should work with $index', function (t) {
      var F = _F('$index').lte(10);

      t.equal(data.filter(F).length, 11);
      t.equal(data.filter(F)[9], data[9]);
      t.end();
    });
  });

  t.test('#gt', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').gt(newDate(1979));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 26);
      t.end();
    });

    t.test('should work with $index', function (t) {
      var F = _F('$index').gt(10);

      t.equal(data.filter(F).length, data.length - 11);
      t.equal(data.filter(F)[0], data[11]);
      t.end();
    });
  });

  t.test('#gte', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').gte(newDate('1980'));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 26);
      t.end();
    });

    t.test('should work with $index', function (t) {
      var F = _F('$index').gte(10);

      t.equal(data.filter(F).length, data.length - 10);
      t.equal(data.filter(F)[0], data[10]);
      t.end();
    });
  });

  t.test('#between', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').between(newDate('1980'), newDate('1990'));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 9);
      t.end();
    });

    t.test('should work with $index', function (t) {
      var F = _F('$index').between(10, 20);

      t.equal(data.filter(F).length, 9);
      t.equal(data.filter(F)[0], data[11]);
      t.end();
    });
  });

  t.test('#exists', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').exists();

      t.equal(f({year: 1990, value: 8.89}), true);
      t.equal(f({value: 8.89}), false);
      t.equal(f({year: null}), false);
      t.equal(data.filter(f).length, 29);
      t.end();
    });
  });

  t.test('#typeof', function (t) {
    t.test('should work with key', function (t) {
      var f = _F('year').typeof('number');

      t.equal(f({year: 1990, value: 8.89}), true);
      t.equal(f({year: '1990', value: 8.89}), false);
      t.equal(data.filter(f).length, 29);
      t.end();
    });
  });

  t.test('#match', function (t) {
    t.test('should work with regex', function (t) {
      var f = _F('year').match(/19[89]./);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 20);  // TODO: check
      t.end();
    });

    t.test('should work with string', function (t) {
      var f = _F('year').match('19[89].');

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 20);  // TODO: check
      t.end();
    });
  });

  t.test('#and', function (t) {
    t.test('should work with simple accessor function', function (t) {
      newDate.called = 0;

      var F1 = _F('value').gt(0);
      var F2 = function (d) {
        return d.year < newDate(1990);
      };
      var f = F1.and(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      t.equal(newDate.called, 26);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });

    t.test('should work with _F, new key', function (t) {
      newDate.called = 0;

      var F1 = _F('value').gt(0);
      var F2 = _F('year').lt(newDate(1990));
      var f = F1.and(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      t.equal(newDate.called, 1);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });

    t.test('should work with identity function', function (t) {
      var f = _F('year').gt(newDate(1979)).and(_F().lt(newDate(1990)));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });

    t.test('chaining should not interfere', function (t) {
      var F1 = _F('year').gt(newDate(1979));
      var f = F1.and().lt(newDate(1990));

      _F('year').lt(newDate(1979));
      F1.and().gt(newDate(1990));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });

    t.test('should be chainable, alternate form', function (t) {
      var F1 = _F('year').gt(newDate(1979));
      var f = F1.and().lt(newDate(1990));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });

    t.test('should be chainable with simple accessor', function (t) {
      newDate.called = 0;

      var F2 = function (d) {
        return d.year > newDate(1979);
      };
      var f = _F('year').lt(newDate(1990)).and(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      t.equal(newDate.called, 15);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 20.986);
      t.end();
    });
  });

  t.test('#not', function (t) {
    t.test('should work with simple accessor function', function (t) {
      newDate.called = 0;

      var F1 = _F('value');
      var F2 = function (d) {
        return d.year < newDate(1990);
      };
      var f = F1.not(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 16);

      t.equal(newDate.called, 30);

      var mean = d3_mean(data.filter(f), F1);
      t.equal(mean, 4.5668750000000005);
      t.end();
    });

    t.test('should work with _F, new key', function (t) {
      newDate.called = 0;
      var F1 = _F('value');
      var F2 = _F('year').lt(newDate(1990));
      var f = F1.not(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 16);

      t.equal(newDate.called, 1);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 4.5668750000000005);
      t.end();
    });

    t.test('should work with identity function', function (t) {
      var F1 = _F('year');
      var F2 = _F().lt(newDate(1990));
      var f = F1.not(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 16);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 4.5668750000000005);
      t.end();
    });

    t.test('should be chainable, alternate form', function (t) {
      var F1 = _F('year');
      var f = F1.not().lt(newDate(1980));

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 26);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 10.881923076923073);
      t.end();
    });
  });

  t.test('#or', function (t) {
    t.test('should work with simple accessor function', function (t) {
      newDate.called = 0;

      var F1 = _F('value').gt(15);
      var F2 = function (d) {
        return d.year >= newDate(2000);
      };
      var f = F1.or(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      t.equal(newDate.called, 26);  // Check

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 14.611);
      t.end();
    });

    t.test('should work with _F, new key', function (t) {
      newDate.called = 0;

      var F1 = _F('value').gt(15);
      var F2 = _F('year').gt(newDate(1999));
      var f = F1.or(F2);

      t.equal(f(data[0]), false);
      t.equal(data.filter(f).length, 10);

      t.equal(newDate.called, 1);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 14.611);
      t.end();
    });

    t.test('should work with identity function', function (t) {
      var f = _F('year').gt(newDate(1989)).or(_F().lt(newDate(1980)));

      t.equal(f(data[0]), true);
      t.equal(data.filter(f).length, 19);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 3.845789473684211);
      t.end();
    });

    t.test('should be chainable, alternate form', function (t) {
      var f = _F('year').gt(newDate(1989)).or().lt(newDate(1980));

      t.equal(f(data[0]), true);
      t.equal(data.filter(f).length, 19);

      var mean = d3_mean(data.filter(f), _F('value'));
      t.equal(mean, 3.845789473684211);
      t.end();
    });
  });
});
