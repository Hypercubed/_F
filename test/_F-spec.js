  //var assert = chai.assert;
  //var expect = chai.expect;

  if (typeof module !== 'undefined' && typeof exports === 'object') {
    _F = require('../_F');
    expect = require('chai').expect;
  }

  function d3_number(x) {
    return x != null && !isNaN(x);
  }

  d3_mean = function(array, f) {
    var s = 0,
        n = array.length,
        a,
        i = -1,
        j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_number(a = array[i])) s += a; else --j;
    } else {
      while (++i < n) if (d3_number(a = f.call(array, array[i], i))) s += a; else --j;
    }
    return j ? s / j : undefined;
  };

  describe('_F', function() {

    var rows;
    var data = [];
    var newDate = function(d) {
      newDate.called++;
      return +d;
    }

    var rows = [
      [1977,0],
      [1978,0],
      [1979,0],
      [1980,43.7],
      [1981,38.47],
      [1982,26.87],
      [1983,21.16],
      [1984,14.88],
      [1985,11.31],
      [1986,13.51],
      [1987,12.99],
      [1988,13.13],
      [1989,13.84],
      [1990,8.89],
      [1991,8.89],
      [1992,5.65],
      [1993,3.06],
      [1994,3.35],
      [1995,6.04],
      [1996,6.32],
      [1997,5.64],
      [1998,4.71],
      [1999,4.61],
      [2000,3.96],
      [2001,2.64],
      [2002,2.34],
      [2003,2],
      [2004,2.28],
      [2005,2.69],
    ]

    beforeEach(function() {
      data = rows.map(function(d) {
          return {
            year: +d[0],
            value: +d[1]
          };
        });

      newDate.called  = 0;
    });

    describe('_F()', function() {
      it('should be a function', function() {
        expect(_F).to.be.a('function');
        expect(_F()).to.be.a('function');
      })

      it('should return identity function', function() {
        var F = _F();

        expect(F).to.be.a('function');
        expect(F(5)).to.be.a('number');
        expect(F(5)).to.equal(5);

        expect(F).ownProperty('accessor');
        expect(F.accessor).to.be.a('undefined');
      });

      it('should return an accessor function', function() {
        var F = _F('year');

        expect(F).to.be.a('function');

        expect(F(data[0])).to.be.a('number');
        expect(F(data[0])).to.equal(1977);

        expect(F).to.have.property('key', 'year');
        expect(F).to.have.property('key', 'year');
      });

      it('should return an index accessor function', function() {
        var F = _F('$index');

        expect(F).to.be.a('function');
        expect(data.map(F)).to.have.length(data.length);
        expect(data.map(F)[0]).to.equal(0);
        expect(data.map(F)[5]).to.equal(5);

        expect(F).to.have.property('key', '$index');
      });

      it('should have access to this', function() {
        var F = _F(function(d) {
          return this.name;
        });

        expect(F).to.be.a('function');
        expect(data.map(F)).to.have.length(data.length);

        var _this = { name: 'thisName' };
        expect(data.map(F, _this)[0]).to.equal('thisName');
        expect(data.map(F, _this)[5]).to.equal('thisName');
      });

      it('should return a this accessor function', function() {
        var F = _F('$this');

        expect(F).to.be.a('function');
        expect(data.map(F)).to.have.length(data.length);

        var _this = { name: 'thisName' }
        expect(data.map(F, _this)[0]).to.equal(_this);
        expect(data.map(F, _this)[5]).to.equal(_this);

        expect(F).to.have.property('key', '$this');
      });
    });

    describe('#eq', function() {
      it('should work', function() {
        var F = _F('year').eq(1977);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(true);
        expect(F(data[1])).to.equal(false);
        expect(data.filter(F)).to.have.length(1);

        expect(F).to.have.property('key');
      });
    });

    describe('#lt', function() {
      it('should work with key', function() {
        var F = _F('year').lt(newDate(1990));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(true);
        expect(data.filter(F)).to.have.length(13);

        expect(newDate.called).to.equal(1);

      });

      it('should work with $index', function() {
        var F = _F('$index').lt(10);

        expect(F).to.be.a('function');
        expect(data.filter(F)).to.have.length(10);
        expect(data.filter(F)[9]).to.equal(data[9]);
      });
    });

    describe('#gt', function() {
      it('should work with key', function() {
        var F = _F('year').gt(newDate('1979'));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(26);
        expect(newDate.called).to.equal(1);
      });

      it('should work with $index', function() {
        var F = _F('$index').gt(10);

        expect(F).to.be.a('function');
        expect(data.filter(F)).to.have.length(data.length - 11);
        expect(data.filter(F)[0]).to.equal(data[11]);
      });
    });


    describe('#and', function() {
      it('should work with simple accessor function', function() {
        var F1 = _F('value').gt(0);
        var F2 = function(d) {
          return d.year < newDate(1990);
        };
        var F = F1.and(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(26);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);
      });

      it('should work with _F, new key', function() {
        var F1 = _F('value').gt(0);
        var F2 = _F('year').lt(newDate(1990));
        var F = F1.and(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);
        
        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);

      });

      it('should work with identity function', function() {
        var F = _F('year').gt(newDate('1979')).and(_F().lt(newDate(1990)));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);

      });

      it('should be chainable', function() {
        var F1 = _F('year').gt(newDate('1979'));
        var F = F1.and.lt(newDate(1990));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);
      });


      it('should be chainable, alternate form', function() {
        var F1 = _F('year').gt(newDate('1979'));
        var F = F1.and().lt(newDate(1990));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);
      });

      it('should be chainable with simple accessor', function() {
        var F2 = function(d) {
          return d.year > newDate('1979');
        };
        var F = _F('year').lt(newDate(1990)).and(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(16);  // Check this

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(20.986);
      });

    });

    describe('#not', function() {
      it('should work with simple accessor function', function() {
        var F1 = _F('value');
        var F2 = function(d) {
          return d.year < newDate(1990);
        };
        var F = F1.not(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(16);

        expect(newDate.called).to.equal(31);

        var mean = d3_mean(data.filter(F), F1);
        expect(mean).to.equal(4.5668750000000005);
      });

      it('should work with _F, new key', function() {
        var F1 = _F('value');
        var F2 = _F('year').lt(newDate(1990));
        var F = F1.not(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(16);

        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(4.5668750000000005);
      });

      it('should work with identity function', function() {
        var F1 = _F('year');
        var F2 = _F().lt(newDate(1990));
        var F = F1.not(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(16);

        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(4.5668750000000005);

      });

      it('should be chainable', function() {
        var F = _F('year').not.lt(newDate(1980));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(26);

        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(10.881923076923073);
      });

      it('should be chainable, alternate form', function() {
        var F1 = _F('year');

        //console.log(F1.lt(1990)(data[0]));
        var F = F1.not().lt(newDate(1980));
        //console.log(F1.lt(1990)(data[0]));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(26);

        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(10.881923076923073);
      });

    });

    describe('#or', function() {
      it('should work with simple accessor function', function() {
        var F1 = _F('value').gt(15);
        var F2 = function(d) {
          return d.year >= newDate(2000);
        };
        var F = F1.or(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(27);  // Check

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(14.611);
      });

      it('should work with _F, new key', function() {
        var F1 = _F('value').gt(15);
        var F2 = _F('year').gt(newDate(1999));
        var F = F1.or(F2);

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(false);
        expect(data.filter(F)).to.have.length(10);

        expect(newDate.called).to.equal(1);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(14.611);

      });

      it('should work with identity function', function() {
        var F = _F('year').gt(newDate(1989)).or(_F().lt(newDate(1980)));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(true);
        expect(data.filter(F)).to.have.length(19);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(3.845789473684211);

      });

      it('should be chainable', function() {
        var F = _F('year').gt(newDate(1989)).or.lt(newDate(1980));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(true);
        expect(data.filter(F)).to.have.length(19);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(3.845789473684211);
      });

      it('should be chainable, alternate form', function() {
        var F = _F('year').gt(newDate(1989)).or().lt(newDate(1980));

        expect(F).to.be.a('function');
        expect(F(data[0])).to.be.a('boolean');
        expect(F(data[0])).to.equal(true);
        expect(data.filter(F)).to.have.length(19);

        expect(newDate.called).to.equal(2);

        var mean = d3_mean(data.filter(F), _F('value'));
        expect(mean).to.equal(3.845789473684211);
      });

    });


    xit('#gt chaining', function() {
      var F = _F('year').gt(1979).lt(1990);

      expect(F).to.be.a('function');
      expect(F(data[0])).to.be.a('boolean');
      //expect(F(data[0])).to.equal(false);
      expect(data.filter(F)).to.have.length(10);

      var mean = d3_mean(data.filter(F), _F('value'));
      expect(mean).to.equal(20.986);
    });

    //it('something interesting', function(){
    //  var F = _F('year').gt(1990).and(_F('value'));
    //   console.log(data.filter(F).map(F));
    //});

    /* it('key chaining', function(){
      _data = data.map(function(d) { return { 'date': { 'year': d.year } } });
      
      var F = _F('date', 'year').gt(1980);
      
      console.log(data.filter(F).map(F));
      
    }); */

    xit('#not.and', function() {
      var F = _F('year').not.lt(1980).and.lt(1990);

      expect(F).to.be.a('function');
      expect(F(data[0])).to.be.a('boolean');
      expect(F(data[0])).to.equal(false);
      expect(data.filter(F)).to.have.length(10);

      var mean = d3_mean(data.filter(F), _F('value'));
      expect(mean).to.equal(20.986);
    });

    xit('#and.not', function() {
      var F = _F('year').lt(1990).and.not.lt(1980);

      expect(F).to.be.a('function');
      expect(F(data[0])).to.be.a('boolean');
      expect(F(data[0])).to.equal(false);
      expect(data.filter(F)).to.have.length(10);

      var mean = d3_mean(data.filter(F), _F('value'));
      expect(mean).to.equal(20.986);

    });

    it('chained commands should not mutate original', function() {
      var F1 = _F('year');
      var A = data.filter(F1.lt(1980)).length;

      F1.or().lt(1880);
      expect(data.filter(F1.lt(1980))).to.have.length(A);

      F1.and().lt(1880);
      expect(data.filter(F1.lt(1980))).to.have.length(A);

      F1.not().lt(1880);
      expect(data.filter(F1.lt(1980))).to.have.length(A);
    });

    xit('filter and map thing', function() {
      var F = _F('year').gt(1980).and(_F('value'));

      expect(F).to.be.a('function');
      expect(data.filter(F)).to.have.length(25);

      var mean = d3_mean(data.filter(F).map(F));
      expect(mean).to.equal(9.5692);

    });

    ((typeof module !== 'undefined') ? describe.skip : describe)('should work in d3', function() {

      //if (d3 === undefined) return;

      var elms;

      beforeEach(function() {

        d3.select('#test').remove();

        var container = d3.select('body')
          .append('div')
          .attr('id', 'test');

        container
          .selectAll('li').data(['apple','banana','carrot'])
            .enter()
              .append('li')
              .attr('id', function(d) { return d; })
              .text(function(d) { return d; });

        elms = container.selectAll('li').data(data);
        elms.enter()
          .append('li')
            .attr('id', 'year')
            .text(function(d) { return d.year; });
      });

      it('as an accessor', function() {
        expect(elms[0]).to.have.length(29);
      });

      it('as a filter', function() {
        var F = _F('year');
        expect(elms.filter(F.gt(newDate(1990)))[0]).to.have.length(15);
        expect(elms.filter(F.lt(newDate(1990)))[0]).to.have.length(13);
        //expect(elms.filter(F.eq(newDate(1990)))[0]).to.have.length(1);

        expect(newDate.called).to.equal(2);
      });

      it('with access to this', function() {
        var F = _F(function(d) {
          return this.id.length;
        });

        expect(elms.filter(F.gt(5))[0]).to.have.length(2);
        expect(elms.filter(F.lt(6))[0]).to.have.length(27);
        expect(elms.filter(F.eq(4))[0]).to.have.length(26);
      });


      it('with access to this, chained', function() {
        var F1 = _F(function(d) {
          return this.id.length;
        }).eq(4);
        var F2 = _F('year').lt(newDate(1990));

        expect(elms.filter(F1)[0]).to.have.length(26);
        expect(elms.filter(F2)[0]).to.have.length(13);
        expect(elms.filter(F1.and(F2))[0]).to.have.length(10);

        expect(newDate.called).to.equal(1);
      });

      //it('with access to this, chained', function(){
      //  var F = _F('$this.id').gt(5);
      //  console.log(elms.filter(F).map(function(d) {console.log(d)}));
      //});

    });

    // What is this: data.map(_F('$index').gt(20).and(_F('value'))).forEach(function(d) {console.log(d); })
  })