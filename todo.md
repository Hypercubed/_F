# Todo list

_\( managed using [todo-md](https://github.com/Hypercubed/todo-md) \)_

# Operators

- [ ] isNull:
- [ ] isNotNull:
- [ ] between:
- [ ] Improve `in` and `test`.
- [ ] F('key').limit(x) = F('key.$index').lt(x)
- [ ] F('key').skip(x)  = F('key.$index').gt(x)

# Group By and Aggregators?

- [ ] sum, F('key').sum = function(a,b) { return a['key']+b['key']; }
- [ ] avg
- [ ] count
- [ ] distinct
- [ ] max
- [ ] mix
- [ ] stddev

# Readme

- [ ] Expand intro, quick examples of map and filter

# Other
- [ ] Clean up and comment.  Better documentation of factory function.
- [ ] Use https://github.com/CrossEye/ramda?
- [ ] Use docco?
- [ ] Provide ability to mixin new operators and chains?
- [ ] Ensure accessor functions are not altered by factory.
- [ ] Sub keys?  _F('array.value') or _F(['array','value']) or _F('array').get('value')
