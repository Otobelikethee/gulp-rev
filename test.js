'use strict';
const path = require('path');
const assert = require('assert');
const gutil = require('gulp-util');
const rev = require('./');

it('should rev files', cb => {
	const stream = rev();

	stream.on('data', file => {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should add the revision hash before the first `.` in the filename', cb => {
	const stream = rev();

	stream.on('data', file => {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css.map');
		assert.equal(file.revOrigPath, 'unicorn.css.map');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css.map',
		contents: new Buffer('')
	}));

	stream.end();
});

it('should build a rev manifest file', cb => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'unicorn.css': 'unicorn-d41d8cd98f.css'}
		);
		cb();
	});

	const file = new gutil.File({
		path: 'unicorn-d41d8cd98f.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(file);
	stream.end();
});

it('should allow naming the manifest file', cb => {
	const path = 'manifest.json';
	const stream = rev.manifest({path});

	stream.on('data', newFile => {
		assert.equal(newFile.relative, path);
		cb();
	});

	const file = new gutil.File({
		path: 'unicorn-d41d8cd98f.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(file);
	stream.end();
});

it('should append to an existing rev manifest file', cb => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});

	stream.on('data', newFile => {
		assert.equal(newFile.relative, 'test.manifest-fixture.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{
				'app.js': 'app-a41d8cd1.js',
				'unicorn.css': 'unicorn-d41d8cd98f.css'
			}
		);
		cb();
	});

	const file = new gutil.File({
		path: 'unicorn-d41d8cd98f.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(file);
	stream.end();
});

it('should not append to an existing rev manifest by default', cb => {
	const stream = rev.manifest({path: 'test.manifest-fixture.json'});

	stream.on('data', newFile => {
		assert.equal(newFile.relative, 'test.manifest-fixture.json');
		assert.deepEqual(
			JSON.parse(newFile.contents.toString()),
			{'unicorn.css': 'unicorn-d41d8cd98f.css'}
		);
		cb();
	});

	const file = new gutil.File({
		path: 'unicorn-d41d8cd98f.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	stream.write(file);
	stream.end();
});

it('should sort the rev manifest keys', cb => {
	const stream = rev.manifest({
		path: 'test.manifest-fixture.json',
		merge: true
	});

	stream.on('data', newFile => {
		assert.deepEqual(
			Object.keys(JSON.parse(newFile.contents.toString())),
			['app.js', 'pony.css', 'unicorn.css']
		);
		cb();
	});

	const file = new gutil.File({
		path: 'unicorn-d41d8cd98f.css',
		contents: new Buffer('')
	});

	file.revOrigPath = 'unicorn.css';

	const fileTwo = new gutil.File({
		path: 'pony-d41d8cd98f.css',
		contents: new Buffer('')
	});

	fileTwo.revOrigPath = 'pony.css';

	stream.write(file);
	stream.write(fileTwo);
	stream.end();
});

it('should respect directories', cb => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'unicorn.css')] = path.join('foo', 'unicorn-d41d8cd98f.css');
		MANIFEST[path.join('bar', 'pony.css')] = path.join('bar', 'pony-d41d8cd98f.css');

		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		cb();
	});

	const file1 = new gutil.File({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'foo', 'unicorn-d41d8cd98f.css'),
		contents: new Buffer('')
	});

	file1.revOrigBase = __dirname;
	file1.revOrigPath = path.join(__dirname, 'foo', 'unicorn.css');
	file1.origName = 'unicorn.css';
	file1.revName = 'unicorn-d41d8cd98f.css';

	const file2 = new gutil.File({
		cwd: __dirname,
		base: __dirname,
		path: path.join(__dirname, 'bar', 'pony-d41d8cd98f.css'),
		contents: new Buffer('')
	});

	file2.revOrigBase = __dirname;
	file2.revOrigPath = path.join(__dirname, 'bar', 'pony.css');
	file2.origName = 'pony.css';
	file2.revName = 'pony-d41d8cd98f.css';

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

it('should respect files coming from directories with different bases', cb => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
		MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

		assert.equal(newFile.relative, 'rev-manifest.json');
		assert.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		cb();
	});

	const file1 = new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'foo', 'scriptfoo-d41d8cd98f.js'),
		contents: new Buffer('')
	});

	file1.revOrigBase = path.join(__dirname, 'vendor1');
	file1.revOrigPath = path.join(__dirname, 'vendor1', 'foo', 'scriptfoo.js');
	file1.origName = 'scriptfoo.js';
	file1.revName = 'scriptfoo-d41d8cd98f.js';

	const file2 = new gutil.File({
		cwd: __dirname,
		base: path.join(__dirname, 'output'),
		path: path.join(__dirname, 'output', 'bar', 'scriptbar-d41d8cd98f.js'),
		contents: new Buffer('')
	});

	file2.revOrigBase = path.join(__dirname, 'vendor2');
	file2.revOrigPath = path.join(__dirname, 'vendor2', 'bar', 'scriptbar.js');
	file2.origName = 'scriptfoo.js';
	file2.revName = 'scriptfoo-d41d8cd98f.js';

	stream.write(file1);
	stream.write(file2);
	stream.end();
});

it('should store the hashes for later', cb => {
	const stream = rev();

	stream.on('data', file => {
		assert.equal(file.path, 'unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'unicorn.css');
		assert.equal(file.revHash, 'd41d8cd98f');
		cb();
	});

	stream.write(new gutil.File({
		path: 'unicorn.css',
		contents: new Buffer('')
	}));
});

it('should handle sourcemaps transparently', cb => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'maps/pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'maps/pastissada.css.map',
		contents: new Buffer(JSON.stringify({file: 'pastissada.css'}))
	}));
});

it('should handle unparseable sourcemaps correctly', cb => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'pastissada.css.map',
		contents: new Buffer('Wait a minute, this is invalid JSON!')
	}));
});

it('should be okay when the optional sourcemap.file is not defined', cb => {
	const stream = rev();

	stream.on('data', file => {
		if (path.extname(file.path) === '.map') {
			assert.equal(file.path, 'pastissada-d41d8cd98f.css.map');
			cb();
		}
	});

	stream.write(new gutil.File({
		path: 'pastissada.css',
		contents: new Buffer('')
	}));

	stream.end(new gutil.File({
		path: 'pastissada.css.map',
		contents: new Buffer(JSON.stringify({}))
	}));
});

it('should handle a . in the folder name', cb => {
	const stream = rev();

	stream.on('data', file => {
		assert.equal(file.path, 'mysite.io/unicorn-d41d8cd98f.css');
		assert.equal(file.revOrigPath, 'mysite.io/unicorn.css');
		cb();
	});

	stream.write(new gutil.File({
		path: 'mysite.io/unicorn.css',
		contents: new Buffer('')
	}));
});

it('should use correct base path for each file', cb => {
	const stream = rev.manifest();

	stream.on('data', newFile => {
		const MANIFEST = {};
		MANIFEST[path.join('foo', 'scriptfoo.js')] = path.join('foo', 'scriptfoo-d41d8cd98f.js');
		MANIFEST[path.join('bar', 'scriptbar.js')] = path.join('bar', 'scriptbar-d41d8cd98f.js');

		assert.deepEqual(JSON.parse(newFile.contents.toString()), MANIFEST);
		cb();
	});

	const fileFoo = new gutil.File({
		cwd: 'app/',
		base: 'app/',
		path: path.join('app', 'foo', 'scriptfoo-d41d8cd98f.js'),
		contents: new Buffer('')
	});
	fileFoo.revOrigPath = 'scriptfoo.js';

	const fileBar = new gutil.File({
		cwd: 'assets/',
		base: 'assets/',
		path: path.join('assets', 'bar', 'scriptbar-d41d8cd98f.js'),
		contents: new Buffer('')
	});
	fileBar.revOrigPath = 'scriptbar.js';

	stream.write(fileFoo);
	stream.write(fileBar);
	stream.end();
});
