'use strict';
var LIVERELOAD_PORT = 35729;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var path = require('path');
var mountFolder = function (connect, dir) {
    return connect.static(path.resolve(dir));
};

module.exports = function (grunt) {

     // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        release: {},
        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            lib: ['lib/**/*.js', 'Gruntfile.js'],
            test: 'test/**/*.js'
        },
        simplemocha: {
            all: {
                src: ['test/**/*.test.js']
            }
        },
        watch: {
            scripts: {
                files: [
                    'Gruntfile.js',
                    'lib/**/*.js',
                    'test/**/*.js',
                    'example/**/*.js'
                ],
                tasks: ['jshint', 'simplemocha'],
                options: {
                }
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    'node_modules/swagger-ui/dist/*',
                    'example/*',
                    'lib/**/*.js'
                ]
            },
            develop: {
                files: ['example/{,*/}*.js', 'lib/**/*.js'],
                tasks: ['develop'],
                options: { nospawn: true }
            },
        },
        // Run the server
        develop: {
            server: {
                file: path.resolve(__dirname, 'example/app.js'),
                nodeArgs: [],
                args: [],
                env: { }
            }
        },
        // The actual grunt server settings
        connect: {
            options: {
                port: 9000,
                livereload: LIVERELOAD_PORT,
                // Change this to '0.0.0.0' to access the server from outside
                hostname: 'localhost'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                                lrSnippet,
                                mountFolder(connect, 'example'),
                                mountFolder(connect, 'node_modules/swagger-ui/dist'),
                            ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>/example.html'
            }
        }
    });

    grunt.registerTask('test', 'simplemocha');
    grunt.registerTask('serve', ['jshint', 'simplemocha', 'develop:server', 'connect:livereload', 'open', 'watch']);
    grunt.registerTask('default', ['jshint', 'simplemocha']);

};