#!/usr/bin/env node
/**
 * Node test runner: node tests/run.js
 *
 * Loads data/*.js and src/*.js onto the global Woodgrove object (just like the browser does),
 * runs every tests/*.test.js file and exits with code 1 if anything fails.
 * It also checks that every file is registered in tests/index.html, so both runners stay in sync.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
const green = paint(32);
const red = paint(31);
const dim = paint(2);
const bold = paint(1);

const relative = (file) => path.relative(ROOT, file).split(path.sep).join('/');

function listJs(dir, filter = (name) => name.endsWith('.js')) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter(filter)
    .sort()
    .map((name) => path.join(full, name));
}

const dataFiles = listJs('data');
const srcFiles = listJs('src');
const testFiles = listJs('tests', (name) => name.endsWith('.test.js'));

checkBrowserRunner();

// Load the code under test onto global Woodgrove, named after the file: src/iban.js → Woodgrove.iban.
globalThis.Woodgrove = globalThis.Woodgrove || {};
for (const file of [...dataFiles, ...srcFiles]) {
  const name = path.basename(file, '.js').replace(/[-_](\w)/g, (_, letter) => letter.toUpperCase());
  globalThis.Woodgrove[name] = require(file);
}

const harness = require('./harness');
Object.assign(globalThis, { describe: harness.describe, test: harness.test, it: harness.test, expect: harness.expect });

const loadErrors = [];
for (const file of testFiles) {
  try {
    require(file);
  } catch (error) {
    loadErrors.push({ file, error });
  }
}

const started = Date.now();
harness.run().then((results) => {
  let currentSuite = null;
  console.log('');

  for (const result of results) {
    if (result.suite !== currentSuite) {
      currentSuite = result.suite;
      console.log(bold(currentSuite));
    }
    if (result.passed) {
      console.log(`  ${green('✓')} ${result.name}`);
    } else {
      console.log(`  ${red('✗')} ${result.name}`);
      console.log(indent(result.error.message, 6, red));
      if (result.logs.length) console.log(indent(`console.log:\n${result.logs.join('\n')}`, 6, dim));
    }
  }

  for (const { file, error } of loadErrors) {
    console.log(`\n${red('✗')} ${relative(file)} could not be loaded`);
    console.log(indent(error.stack || String(error), 6, red));
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed + loadErrors.length;
  const ms = Date.now() - started;

  console.log('');
  if (results.length === 0 && loadErrors.length === 0) {
    console.log(red('No tests found in tests/*.test.js'));
    process.exitCode = 1;
  } else if (failed > 0) {
    console.log(`${red(bold(`✗ ${failed} failed`))}, ${passed} passed ${dim(`(${ms} ms)`)}`);
    process.exitCode = 1;
  } else {
    console.log(`${green(bold(`✓ ${passed} passed`))} ${dim(`(${ms} ms)`)}`);
  }
});

function indent(text, spaces, color) {
  const pad = ' '.repeat(spaces);
  return color(String(text).split('\n').map((line) => pad + line).join('\n'));
}

/** Fail early, with the exact lines to add, if tests/index.html is out of date. */
function checkBrowserRunner() {
  const htmlFile = path.join(__dirname, 'index.html');
  const html = fs.readFileSync(htmlFile, 'utf8');
  const registered = new Set();
  for (const match of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)) {
    registered.add(path.resolve(__dirname, match[1]));
  }

  const missing = [...dataFiles, ...srcFiles, ...testFiles].filter((file) => !registered.has(file));
  const broken = [...registered].filter((file) => !fs.existsSync(file));
  if (missing.length === 0 && broken.length === 0) return;

  console.error(red(bold('\ntests/index.html is out of sync with the files in this repository.\n')));
  if (missing.length) {
    console.error('Add a <script> tag for each new file to tests/index.html, so the browser runner loads it too:');
    for (const file of missing) {
      const where = file.startsWith(path.join(ROOT, 'tests'))
        ? 'in the "Test files" section'
        : 'in the "Code under test" section, after the files it depends on';
      console.error(`  <script src="${path.relative(__dirname, file).split(path.sep).join('/')}"></script>   ${dim(where)}`);
    }
  }
  if (broken.length) {
    console.error('\ntests/index.html loads files that do not exist. Remove or fix these <script> tags:');
    for (const file of broken) console.error(`  ${relative(file)}`);
  }
  console.error('');
  process.exit(1);
}
