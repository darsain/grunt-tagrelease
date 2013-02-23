/*
 * grunt-tagrelease
 * https://github.com/Darsain/grunt-tagrelease
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */
'use strict';

module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: '.jshintrc',
			},
			all: [
				'Gruntfile.js',
				'tasks/*.js',
			],
		},
		bumpup: 'test/metafile.json',
		tagrelease: 'test/metafile.json'
	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-bumpup');

	// Registering the testing task.
	grunt.registerTask('test', function (release) {
		release = release ? release : 'patch';
		grunt.task.run('bumpup:' + release);
		grunt.task.run('tagrelease');
	});

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);
};