'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');

const benchpress = require('../../lib/benchpress');

function prepare(sourceDir, expectedDir) {
	const [sourceArr, expectedArr] = [sourceDir, expectedDir]
		.map(dir => fs.readdirSync(dir).map(file => [
			file.replace(/(\.tpl|\.html|\.hbs)$/, ''),
			fs.readFileSync(path.join(dir, file), 'utf-8'),
		]));

	const expected = expectedArr.reduce((prev, [key, text]) => {
		prev[key] = text;
		return prev;
	}, {});

	const missing = [];

	const source = sourceArr.reduce((prev, [key, text]) => {
		if (expected[key] == null) {
			missing.push(key);
			return prev;
		}

		prev[key] = text;
		return prev;
	}, {});

	return [source, expected, missing];
}

function collapseWhitespace(str) {
	return str
	.replace(/(?:[ \t]*[\r\n]+[ \t]*)+/g, '\n')
	.replace(/[\t ]+/g, ' ')
	.replace(/ (<)|(>) /g, '$1$2')
	.trim();
}

function compileTemplate(src, dest, callback) {
	async.waterfall([
		next => fs.readFile(src, next),
		(file, next) => benchpress.precompile({ source: file.toString() }, next),
		(code, next) => fs.writeFile(dest, code, next),
	], callback);
}

exports.compileTemplate = compileTemplate;
exports.prepare = prepare;
exports.collapseWhitespace = collapseWhitespace;
