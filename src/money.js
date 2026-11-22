/**
 * Money helpers for Woodgrove Transfers.
 *
 * Amounts are always an integer number of euro cents: € 1.234,56 is 123456.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.money = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Dutch notation: optional thousands dots, optional decimal comma with 1 or 2 digits.
  const DUTCH_AMOUNT = /^(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?$/;
  // Also accept "12.50", the way amounts are often typed on an English keyboard.
  const DOT_DECIMAL = /^\d+\.\d{1,2}$/;

  const euroFormatter = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });

  /**
   * Parse what a customer typed into an integer number of cents.
   * "1.234,56" → 123456, "€ 12,5" → 1250, "12.50" → 1250. Anything else → NaN.
   */
  function parseAmount(text) {
    if (typeof text !== 'string') return NaN;

    let cleaned = text.trim().replace(/^€\s*/, '');
    if (DOT_DECIMAL.test(cleaned)) cleaned = cleaned.replace('.', ',');

    const match = DUTCH_AMOUNT.exec(cleaned);
    if (!match) return NaN;

    const euros = Number(match[1].replace(/\./g, ''));
    const cents = Number((match[2] || '0').padEnd(2, '0'));
    const total = euros * 100 + cents;

    return Number.isSafeInteger(total) ? total : NaN;
  }

  /** Format cents for customers: 123456 → "€ 1.234,56". */
  function formatAmount(cents) {
    if (!Number.isInteger(cents)) {
      throw new TypeError('formatAmount expects an integer number of cents');
    }
    // Intl puts a non-breaking space after the euro sign; use a normal space for predictable output.
    return euroFormatter.format(cents / 100).replace(/[\u00a0\u202f]/g, ' ');
  }

  return {
    parseAmount,
    formatAmount,
  };
});
