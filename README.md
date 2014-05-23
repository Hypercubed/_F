# _F

Functional chaining in js.

## Usage
1. `bower install Hypercubed/_F`
2. Include the `_F.js` script into your app.  By default should be at `bower_components/_F/_F.js`


## Testing

Install npm and bower dependencies:

```bash
	npm install
	bower install
	npm test
```

## Why?

In javascript, especially when using d3, we often write accessor functions like this:

```js
function(d) { return d.value; }
```

This simple function returns the value of the `value` key when an object is pass to it.  For example in the `map` function:

```js
values = data.map(function(d) { return d.value; });
```

This is lightweight, simple, and readable.  There is nothing wrong with it.  Sometimes, however, in order to avoid repeating ourselves so we crete a reusable accessor function like this:

```js
var _value = function(d) { return d.value; };
values = data.map(_value);
```

Now imagine the object also has a `year` key whose values are date objects.  We may want to filter like this:

```js
var _value = function(d) { return d.value; };
var _year_filter = function(d) { return d.year > new Date('1990 Jan 1'); };
values = data.filter(_year_filter).map(_value);
```

However, this has a couple of slight drawbacks.  First of all you will need to create a new filter every time the date changes; also the `Date` constructor is called for every element in the `data` array.  A better approach is an accessor factory:

```js
var _year_filter = function(date) {
  return function(d) { return d.year > date; };
}

var _filter = _year_filter(new Date('1990 Jan 1'));
values = data.filter(_filter).map(_value);
```

It's a little ugly but here the `Date` constructor is only called once and the _year_filter function returns the accessor.  An new accessor can be created any time by calling `_year_filter`

Now what if we want to filter between two dates.  We can do modify our accessor factory:

```js
var _year_filter = function(dateA, dateB) {
  return function(d) { return d.year > new Date(dateA) && d.year < new Date(dateB); };
}
```

but let's say that you have multidimensional data where `dateA` and `dataB` change independently.  You might be tempted to do something like this:
 
```js
var _year_gt = function(dateA) {
  return function(d) { return d.year > dateA; };
}

var _year_lt = function(dateB) {
  return function(d) { return d.year < dateB; };
}

_year_filter1 = _year_gt(new Date('1980 Jan 1'));
_year_filter2 = _year_lt(new Date('1990 Jan 1'));

values = data
  .filter(_year_filter1)
  .filter(_year_filter2)
  .map(_value);
```

Ok, no we are getting ridiculous.  The date constructor is not that expensive.  But you can imagine a situation where the values for filters could be very expensive.  For example based on aggregated statistics or reading from the DOM.

Ok, at this point let me introduce `_F`.  `_F` is simply a shortcut for all this.  For example:

```js
var _value = _F('value');
values = data.map(_value);
```

The return value from `_F()` in this case is simply the accessor function `function(d) { return d.value; }`.

Interesting.  How about this:

```js
var _value = _F('value');
var _year_filter = _F('year').gt(new Date('1990 Jan 1'));
values = data.filter(_year_filter).map(_value);
```

`_F('year').gt(value)`  is essentially a shortcut for `function(d) { return d.year > value; }`.

It gets better:

```js
var _value = _F('value');

var _year_filter = 
  _F('year')
    .gt(new Date('1990 Jan 1'))
    .and.lt(new Date('1990 Jan 1'));

values = data.filter(_year_filter).map(_value);
```

or how about this:

```js
var _value = _F('value');
var _value_filter = _value.gt(10);

var _year = _F('year');
var _year_filter = 
  _year
    .gt(new Date('1980 Jan 1'))
    .and.lt(new Date('1990 Jan 1'));

var _filter = _value_filter.and(_year_filter);

values = data.filter(_filter).map(_value);
```

Pretty neat?

## Acknowledgments

## License
Copyright (c) 2014+ Jayson Harshbarger
MIT
