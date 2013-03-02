# grunt-tagrelease

Commit the changes and tag the last commit with a version from provided JSON file. If there is nothing to commit, the
task will tag the current last commit.

This task has been created to work with other tasks like [grunt-bumpup](https://github.com/Darsain/grunt-bumpup) to help
create a nicely configurable release task. You can see an example in **[Usage Examples section](#usage-examples)**.

This is a [Grunt](http://gruntjs.com/) 0.4 plugin. If you haven't used [Grunt](http://gruntjs.com/) before, be sure to
check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a
[Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins.

## Installation

Use npm to install and save the plugin into `devDependencies`.

```shell
npm install grunt-tagrelease --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-tagrelease');
```

## Configuration

In your project's Gruntfile, add a section named `tagrelease` to the data object passed into `grunt.initConfig()`. This is a
simple task, and does not conform to multi task options & files input types! All available configuration styles are
described below.

This is the most verbose form of the configuration with default options and a version from a JSON file:

```js
grunt.initConfig({
	tagrelease: {
		file: 'package.json',
		commit:  true,
		message: 'Release %version%',
		prefix:  'v',
		annotate: false,
	},
});
```

Version from a `version` property, and no prefix:

```js
grunt.initConfig({
	tagrelease: {
		version: '1.0.1',
		prefix:  '',
	},
});
```

Version retrieved from a function passed to the `version` property, and enabled anotated tags:

```js
grunt.initConfig({
	tagrelease: {
		version: function () {
			return '1.0.1';
		},
		anotated:  true,
	},
});
```

#### Simple configs

Default options and a new version from a JSON file:

```js
grunt.initConfig({
	tagrelease: 'package.json'
});
```

Default options and a new version passed directly:

```js
grunt.initConfig({
	tagrelease: '1.0.1'
});
```

Default options and a new version from a function:

```js
grunt.initConfig({
	tagrelease: function () {
		return '1.0.1';
	}
});
```

## Options

#### version
Type: `Mixed`
Default: `null`

New version that will be used as a new tag name. Has a priority over the `file` option below. Can be a string or a
function that returns a string. You have to define either this, or a `file` option below, otherwise the task won't know
what should be the new tag.

#### file
Type: `String`
Default: `null`

Path to the JSON file with version that should be used as a new tag. You have to define either this, or a `version`
option above, otherwise the task won't know what should be the new tag.

#### commit
Type: `Boolean`
Default: `true`

Whether to commit any un-staged changes before tagging. Does the `git commit -a` command.

#### message
Type: `String`
Default: `Release %version%`

Message to be used in commits, and annotated tags. Available is one token:

- `%version%` - Will be replaced with a new version, without a prefix.

#### prefix
Type: `String`
Default: `v`

Tag prefix.

#### annotate
Type: `Boolean`
Default: `false`

Whether the new tag should be annotated. If enabled, the tag will receive a message from `message` option.

## Usage Examples

#### Release task

In this example, we create a release task that handles everything needed to build a new release of a project:

```js
// Tasks configuration
grunt.initConfig({
	jshint: ...,
	uglify: ...,
	bumpup: 'package.json',
	tagrelease: 'package.json'
});

// Load the plugins
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-uglify');
grunt.loadNpmTasks('grunt-bumpup');
grunt.loadNpmTasks('grunt-tagrelease');

// Release alias task
grunt.registerTask('release', function (type) {
	type = type ? type : 'patch';
	grunt.task.run('jshint');         // Lint stuff
	grunt.task.run('uglify');         // Minify stuff
	grunt.task.run('bumpup:' + type); // Bump up the package version
	grunt.task.run('tagrelease');     // Commit & tag the changes from above
});
```

And now you can call this command to create a new minor release of a project:

```shell
grunt release:minor
```