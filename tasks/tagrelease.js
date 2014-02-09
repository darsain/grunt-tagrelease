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
	getTags: function () {
		if (this.tags != null) {
			return this.tags;
		}
		var tags = exec('git tag');
		return tags.code !== 0 ? [] : tags.output.split('\n').filter(function (tag) {
			return !!String(tag).trim();
		});
	},
	getHighestTag: function () {
		var highestTag = '0.0.0';
		this.getTags().forEach(function (tag) {
			if (semver.valid(tag) && semver.gt(tag, highestTag)) {
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
	},
	tagExists: function (name) {
		return ~this.getTags().indexOf(name);
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
		grunt.log.warn('grunt-tagrelease is being deprecated in favor of grunt-release. Please migrate.');
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
			prefix:  '',
			annotate: false,
		}, config);
		var newVersion, buildMeta, newTag;

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
					var meta = grunt.file.readJSON(o.file);
					if (typeof meta.version === 'undefined') {
						failed('File "' + o.file + '" has no version property.');
						return;
					}
					newVersion = meta.version;
				}
		}

		// Validate new version
		buildMeta = newVersion.split('+')[1];
		newVersion = semver.valid(newVersion);
		if (!newVersion) {
			failed('"' + newVersion + '" is not a valid semantic version.');
			return;
		}
		if (buildMeta) {
			newVersion += '+' + buildMeta;
		}
		newTag = o.prefix + newVersion;

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
		if (highestTag && (buildMeta ?
			!(semver.gte(newVersion, highestTag) && !git.tagExists(newTag)) :
			!semver.gt(newVersion, highestTag))) {
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
			grunt.log.writeln('Tagged as: ' + newTag.cyan);
		}
	});
};