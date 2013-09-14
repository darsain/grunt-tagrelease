/*
 * grunt-tagrelease
 * https://github.com/Darsain/grunt-tagrelease
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */
'use strict';

var shell  = require('shelljs');
var semver = require('semver');

/**
 * Execute a shell command.
 *
 * @param  {String} command
 *
 * @return {Object}
 */
function exec(command) {
	return shell.exec(command, { silent: true });
}

/**
 * Git convenience methods.
 *
 * @type {Object}
 */
var git = {
	exists: function () {
		return exec('git status').code !== 0;
	},
	getHighestTag: function () {
		var highestTag = '0.0.0';
		var tags = exec('git tag');

		if (tags.code !== 0) {
			return highestTag;
		}

		tags = tags.output.split('\n');
		tags.forEach(function (tag) {
			tag = semver.valid(tag);
			if (tag && (!highestTag || semver.gt(tag, highestTag))) {
				highestTag = tag;
			}
		});

		return highestTag;
	},
	isClean: function () {
		return exec('git diff-index --quiet HEAD --').code === 0;
	},
	isTagged: function () {
		return !!exec('git tag --points-at HEAD').output.split('\n').filter(function (line) { return !!line; }).length;
	}
};

module.exports = function(grunt) {
	// Error handler
	function failed(message, error) {
		grunt.fail.warn(message || 'Task failed.');
		if (error) {
			grunt.verbose.error(error);
		}
	}

	// Task definition
	grunt.registerTask('tagrelease', 'Tagging a new release.', function () {
		var config = grunt.config('tagrelease');
		switch (typeof config) {
			case 'string':
				if (grunt.file.isFile(config)) {
					config = { file: config };
				} else if (semver.valid(config)) {
					config = { version: config };
				} else {
					failed('Invalid configuration (file doesn\'t exist, or version is not a valid semantic version).');
					return;
				}
				break;

			case 'function':
				config = { version: config };
				break;
		}
		var o = grunt.util._.extend({
			version: false,
			commit:  true,
			message: 'Release %version%',
			prefix:  'v',
			annotate: false,
		}, config);
		var meta, newVersion;

		// Set the new version
		switch (typeof o.version) {
			case 'string':
				newVersion = o.version;
				break;

			case 'function':
				newVersion = o.version();
				break;

			default:
				// Check metafile validity
				if (typeof o.file === 'undefined' || !grunt.file.isFile(o.file)) {
					failed('File "' + o.file + '" not found.');
					return;
				} else {
					meta = grunt.file.readJSON(o.file);
					if (typeof meta.version === 'undefined') {
						failed('File "' + o.file + '" has no version property.');
						return;
					}
					newVersion = meta.version;
				}
		}

		// Validate new version
		if (semver.valid(newVersion)) {
			newVersion = semver.valid(newVersion);
		} else {
			failed('"' + newVersion + '" is not a valid semantic version.');
			return;
		}

		// Set the message used in commit and annotated tags
		var message = o.message.replace('%version%', newVersion);

		// Check for git repository
		if (git.exists()) {
			failed('Git repository not found.');
			return;
		}

		// Get the current highest repository tag
		var highestTag = git.getHighestTag();

		// Check whether the new tag is higher than the current highest tag
		if (highestTag && !semver.gt(newVersion, highestTag)) {
			failed('Version "' + newVersion + '" is lower or equal than the current highest tag "' + highestTag + '".');
			return;
		}

		// Commit un-staged changes if there are some
		if (o.commit && !git.isClean()) {
			if (exec('git commit -a -m "' + message + '"').code === 0) {
				grunt.log.writeln('Un-staged changes committed as: ' + message.cyan);
			}
		}

		// Tag the last commit
		var tagging = exec('git tag ' + (o.annotate ? '-a -m "' + message + '" ' : ' ') + o.prefix + newVersion);
		if (tagging.code !== 0) {
			failed('Couldn\'t tag the last commit.', tagging.output);
			return;
		} else {
			grunt.log.writeln('Tagged as: ' + (o.prefix + newVersion).cyan);
		}
	});
};