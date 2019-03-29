module.exports = function(grunt) {

    grunt.initConfig({
 
        pkg: grunt.file.readJSON('package.json'),
 
        meta: {
            //basePath: '../'
        },
         
        concat: {
            options: {
                stripBanners: true,
                separator: ';'
            },
            dist: {
                src: [
                        '../../plugins/eb-icheck-list.js',
                        '../../plugins/eb-icheck-filter.js',
                ],
                dest: '../lib/eb-icheck.js'
            }
        },
        
        uglify: {
          options: {
            banner: '/* <%= pkg.description %> ' +
                '(<%= grunt.template.today("yyyy-mm-dd") %>) ' +
                '(c) 2014 - <%= grunt.template.today("yyyy") %> Enterprise Blocks, Inc. ' +
                'License details : <%= pkg.license %> */'
            },
          dist: {
            files: {
                '../lib/eb-icheck.min.js': ['../lib/eb-icheck.js']
            }
          }
        }
        
    });
 
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    
    grunt.registerTask('default', ['concat', 'uglify']);
 
};