module.exports = function(grunt){
  'use strict';

  grunt.initConfig({
    pkg: grunt.file.readJSON('bower.json'),

    jshint: {
      options: { jshintrc: true },
      all: ['gruntfile.js', '<%= pkg.name %>.js']
    },

    bump: {
      options: {
        files: ['bower.json','package.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'release %VERSION%',
        commitFiles: ['package.json','bower.json','<%= pkg.name %>.min.js'],
        pushTo: 'origin',
      }
    },

    uglify: {
      options: {
        banner: [ 
          '/*',
          ' * <%= pkg.title || pkg.name %> <%= pkg.version %> - <%= pkg.description %>',
          ' * Copyright  (c) <%= grunt.template.today("yyyy") %> <%= pkg.authors.join(" ") %> (<%= pkg.license %> Licensed)',
          ' * <%= pkg.homepage %>',
          ' */'
          ].join('\n')
      },
      src: {
        files: {
          '<%= pkg.name %>.min.js': '<%= pkg.name %>.js'
        }
      }
    },

    karma: {
      unit: {
        configFile: 'karma.conf.js',
        autoWatch: true
      },
      once: {
        configFile: 'karma.conf.js',
        singleRun: true,
        autoWatch: false,
        browsers: ['PhantomJS']
      },
      server: {
        configFile: 'karma.conf.js',
        singleRun: false,
        autoWatch: true,
        browsers: ['PhantomJS']
      }
    },

    simplemocha: {
      options: {
        timeout: 3000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec'
      },
      all: { src: ['test/**/*.js'] }
    },

    //'gh-pages': {
    //  src: ['<%= pkg.name %>.js','<%= pkg.name %>.min.js','bower_components/**/*','example/*']
    //}

    watch: {
      fast: {
        options: {
          spawn: true,
        },
        files: '**/*.js',
        tasks: ['test']
      },
      all: {
        options: {
          spawn: true,
        },
        files: '**/*.js',
        tasks: ['test:all']
      }
    }

  });

  require('load-grunt-tasks')(grunt);

  grunt.registerTask('test', ['simplemocha']);
  grunt.registerTask('test:all', ['simplemocha', 'karma:once']);

  grunt.registerTask('mywatch', ['watch:fast']);
  grunt.registerTask('mywatch:all', ['watch:all']);

  grunt.registerTask('build', ['test:all', 'uglify']);
  grunt.registerTask('default', ['test']);
  grunt.registerTask('publish', ['test:all','bump-only','uglify','bump-commit']);

};
