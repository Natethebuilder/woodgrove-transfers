/**
 * A tiny test framework that runs in Node and in the browser.
 *
 *   describe('iban', () => {
 *     test('accepts a Dutch IBAN', () => {
 *       expect(Woodgrove.iban.isValidIban('NL91ABNA0417164300')).toBe(true);
 *     });
 *   });
 *
 * Matchers: toBe, toEqual, toBeTruthy, toBeFalsy, toThrow, toContain, toMatch, toBeNaN,
 * toBeNull, toBeUndefined, toBeDefined, toBeGreaterThan(OrEqual), toBeLessThan(OrEqual),
 * toHaveLength. Put .not in front of any matcher to invert it.
 *
 * console.log output from a test is captured and only shown when that test fails.
 */
(function (root, factory) {
  const harness = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = harness;
  } else {
    root.WoodgroveTests = harness;
    root.describe = harness.describe;
    root.test = harness.test;
    root.it = harness.test;
    root.expect = harness.expect;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const tests = [];
  const suiteStack = [];

  function describe(name, body) {
    suiteStack.push(name);
    try {
      body();
    } finally {
      suiteStack.pop();
    }
  }

  function test(name, body) {
    tests.push({ suite: suiteStack.join(' › ') || '(no suite)', name, body });
  }

  function show(value) {
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'bigint') return `${value}n`;
    if (typeof value === 'function') return `[function ${value.name || 'anonymous'}]`;
    if (value === undefined || Number.isNaN(value)) return String(value);
    try {
      return JSON.stringify(value, (key, v) => (typeof v === 'bigint' ? `${v}n` : v));
    } catch (error) {
      return String(value);
    }
  }

  function deepEqual(a, b) {
    if (Object.is(a, b)) return true;
    if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const keysA = Object.keys(a).filter((key) => a[key] !== undefined);
    const keysB = Object.keys(b).filter((key) => b[key] !== undefined);
    if (keysA.length !== keysB.length) return false;
    return keysA.every((key) => deepEqual(a[key], b[key]));
  }

  function expect(actual) {
    function matchers(negated) {
      const check = (pass, description, ...expected) => {
        if (pass === negated) {
          const lines = [`Expected ${negated ? 'not ' : ''}${description}`];
          if (expected.length > 0) lines.push(`  expected: ${show(expected[0])}`);
          lines.push(`  received: ${show(actual)}`);
          throw new Error(lines.join('\n'));
        }
      };

      return {
        toBe: (expected) => check(Object.is(actual, expected), 'to be (===)', expected),
        toEqual: (expected) => check(deepEqual(actual, expected), 'to equal', expected),
        toBeTruthy: () => check(Boolean(actual), 'a truthy value'),
        toBeFalsy: () => check(!actual, 'a falsy value'),
        toBeNaN: () => check(Number.isNaN(actual), 'NaN'),
        toBeNull: () => check(actual === null, 'null'),
        toBeUndefined: () => check(actual === undefined, 'undefined'),
        toBeDefined: () => check(actual !== undefined, 'a defined value'),
        toBeGreaterThan: (n) => check(actual > n, 'a number greater than', n),
        toBeGreaterThanOrEqual: (n) => check(actual >= n, 'a number greater than or equal to', n),
        toBeLessThan: (n) => check(actual < n, 'a number less than', n),
        toBeLessThanOrEqual: (n) => check(actual <= n, 'a number less than or equal to', n),
        toHaveLength: (n) => check(actual != null && actual.length === n, 'to have length', n),
        toContain: (item) =>
          check(
            actual != null && typeof actual.includes === 'function' && actual.includes(item),
            'to contain',
            item
          ),
        toMatch: (pattern) => {
          const regex = pattern instanceof RegExp ? pattern : new RegExp(String(pattern));
          check(typeof actual === 'string' && regex.test(actual), 'to match', String(regex));
        },
        toThrow: (expected) => {
          if (typeof actual !== 'function') throw new Error('toThrow needs a function: expect(() => …).toThrow()');
          let thrown = null;
          try {
            actual();
          } catch (error) {
            thrown = error || new Error(String(error));
          }
          let pass = thrown !== null;
          if (pass && expected !== undefined) {
            const message = String(thrown.message);
            if (expected instanceof RegExp) pass = expected.test(message);
            else if (typeof expected === 'function') pass = thrown instanceof expected;
            else pass = message.includes(String(expected));
          }
          if (pass === negated) {
            throw new Error(
              `Expected the function ${negated ? 'not ' : ''}to throw` +
                (expected !== undefined ? ` ${show(expected instanceof RegExp ? String(expected) : expected.name || expected)}` : '') +
                (thrown ? `\n  thrown: ${thrown.message}` : '\n  nothing was thrown')
            );
          }
        },
      };
    }

    const api = matchers(false);
    api.not = matchers(true);
    return api;
  }

  /** Run every registered test. Resolves to [{ suite, name, passed, error, logs, ms }]. */
  async function run() {
    const results = [];
    for (const { suite, name, body } of tests) {
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => logs.push(args.map((a) => (typeof a === 'string' ? a : show(a))).join(' '));
      const started = Date.now();
      let error = null;
      try {
        await body();
      } catch (caught) {
        error = caught instanceof Error ? caught : new Error(show(caught));
      } finally {
        console.log = originalLog;
      }
      results.push({ suite, name, passed: error === null, error, logs, ms: Date.now() - started });
    }
    return results;
  }

  return { describe, test, it: test, expect, run };
});
