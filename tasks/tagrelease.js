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
		var config   = typeof grunt.config('tagrelease') === 'string' ? { file: grunt.config('tagrelease') } : grunt.config('tagrelease');
		var o        = grunt.util._.extend({
			commit:  true,
			message: 'Release %version%',
			prefix:  'v',
			annotate: false,
		}, config);
		var meta, newVersion;

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
			newVersion = semver.valid(meta.version);
			if (!newVersion) {
				failed('"' + o.newVersion + '" is not a valid semantic version.');
				return;
			}
		}

		// Set the message used in commit and annotated tags
		var message = o.message.replace('%version%', meta.version);

		// Check for git repository
		if (exec('git status').code !== 0) {
			failed('Git repository not found.');
			return;
		}

		// Commit un-staged changes if there are some
		if (o.commit) {
			if (exec('git commit -a -m "' + message + '"').code === 0) {
				grunt.log.writeln('Un-staged changes committed as: ' + message);
			}
		}

		// Get the current highest repository tag
		var tags = shell.exec('git tag', { silent: true });
		var highestTag;

		if (tags.code === 0) {
			tags = tags.output.split('\n');
			tags.forEach(function (tag) {
				tag = semver.valid(tag);
				if (tag && (!highestTag || semver.gt(tag, highestTag))) {
					highestTag = tag;
				}
			});

			// Check whether the new tag is higher than the current highest tag
			if (highestTag && !semver.gt(newVersion, highestTag)) {
				failed('Version in "' + o.file + '" isn\'t higher than the current highest repository tag.');
				return;
			}
		}

		// Tag the last commit
		var tagging = exec('git tag ' + (o.annotate ? '-a -m "' + message + '" ' : ' ') + o.prefix + newVersion);
		if (tagging.code !== 0) {
			failed('Couldn\'t tag the last commit.', tagging.output);
			return;
		} else {
			grunt.log.writeln('Tagged as: ' + o.prefix + newVersion);
		}
	});
};