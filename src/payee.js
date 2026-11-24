/**
 * Verification of Payee (WGB-102): check the beneficiary name against the account holder.
 *
 * verifyPayee('NL20WGBK0123456789', 'J. de Vries') → { result: 'CLOSE_MATCH', suggestedName: 'Jan de Vries' }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./iban'), require('../data/accounts'));
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.payee = factory(root.Woodgrove.iban, root.Woodgrove.accounts);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (iban, accounts) {
  'use strict';

  const MAX_TYPOS = 2;

  /** "  Émilie  VAN den Berg " → "emilie van den berg". Punctuation becomes a space. */
  function normalizeName(name) {
    return String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /** "J. de Vries" matches "Jan de Vries": every word is equal, or an initial of the holder's word. */
  function matchesWithInitials(given, holder) {
    const givenWords = given.split(' ');
    const holderWords = holder.split(' ');
    if (givenWords.length !== holderWords.length) return false;
    const usesInitial = givenWords.some((word, i) => word.length === 1 && word !== holderWords[i]);
    return (
      usesInitial &&
      givenWords.every((word, i) => word === holderWords[i] || (word.length === 1 && holderWords[i].startsWith(word)))
    );
  }

  /** Number of single-character edits (insert, delete, replace) to turn a into b. */
  function editDistance(a, b) {
    let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const current = [i];
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      }
      previous = current;
    }
    return previous[b.length];
  }

  /** Returns { result: 'MATCH' | 'CLOSE_MATCH' | 'NO_MATCH' | 'NOT_POSSIBLE', suggestedName? }. */
  function verifyPayee(accountIban, name) {
    const holderName = accounts[iban.normalizeIban(accountIban)];
    if (!holderName) return { result: 'NOT_POSSIBLE' };

    const given = normalizeName(name);
    const holder = normalizeName(holderName);
    if (!given) return { result: 'NO_MATCH' };
    if (given === holder) return { result: 'MATCH' };

    if (matchesWithInitials(given, holder) || editDistance(given, holder) <= MAX_TYPOS) {
      return { result: 'CLOSE_MATCH', suggestedName: holderName };
    }
    return { result: 'NO_MATCH' };
  }

  return {
    verifyPayee,
  };
});
