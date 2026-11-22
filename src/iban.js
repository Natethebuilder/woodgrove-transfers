/**
 * IBAN helpers for Woodgrove Transfers.
 *
 * An IBAN is a country code, two check digits and a national account number (BBAN),
 * for example NL91 ABNA 0417 1643 00. The check digits make sure that typos are caught.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.iban = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // IBAN length per country (ISO 13616 registry).
  const IBAN_LENGTHS = {
    AD: 24, AE: 23, AT: 20, BE: 16, BG: 22, BR: 29, CH: 21, CY: 28, CZ: 24, DE: 22,
    DK: 18, EE: 20, ES: 24, FI: 18, FR: 27, GB: 22, GI: 23, GR: 27, HR: 21, HU: 28,
    IE: 22, IL: 23, IS: 26, IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31,
    NL: 18, NO: 15, PL: 28, PT: 25, RO: 24, SA: 24, SE: 24, SI: 19, SK: 24, SM: 27,
    TR: 26, VA: 22,
  };

  // Countries that take part in the Single Euro Payments Area (SEPA).
  const SEPA_COUNTRIES = [
    'AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB',
    'GI', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL',
    'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA',
  ];

  /** Remove spaces and use capital letters: "nl91 abna 0417 1643 00" → "NL91ABNA0417164300". */
  function normalizeIban(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/\s+/g, '').toUpperCase();
  }

  /** Two-letter country code of an IBAN, or an empty string. */
  function countryOf(value) {
    const iban = normalizeIban(value);
    return /^[A-Z]{2}/.test(iban) ? iban.slice(0, 2) : '';
  }

  function isSepaCountry(countryCode) {
    return SEPA_COUNTRIES.includes(String(countryCode || '').toUpperCase());
  }

  /** Check the format, the length for the country and the mod-97 check digits. */
  function isValidIban(value) {
    if (typeof value !== 'string') return false;

    const iban = normalizeIban(value);
    if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) return false;
    if (IBAN_LENGTHS[iban.slice(0, 2)] !== iban.length) return false;

    // Move the first four characters to the end and turn letters into numbers (A = 10 … Z = 35).
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    const digits = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

    // Read 15 digits at a time to keep this fast.
    let remainder = 0;
    for (let i = 0; i < digits.length; i += 15) {
      const chunk = digits.slice(i, i + 15);
      remainder = Number(String(remainder) + chunk) % 97;
    }

    return remainder === 1;
  }

  /** Print format in groups of four: "NL91 ABNA 0417 1643 00". */
  function formatIban(value) {
    const iban = normalizeIban(value);
    return iban.replace(/(.{4})(?=.)/g, '$1 ');
  }

  // Mask an IBAN for logs: keep the country code and the last four characters
  /** "NL91 ABNA 0417 1643 00" → "NL************4300". Returns an empty string for empty input. */
  function maskIban(value) {
    const iban = normalizeIban(value);
    if (!iban) return '';
    if (iban.length <= 6) return '*'.repeat(iban.length);
    return iban.slice(0, 2) + '*'.repeat(iban.length - 6) + iban.slice(-4);
  }

  return {
    normalizeIban,
    isValidIban,
    formatIban,
    countryOf,
    isSepaCountry,
    maskIban,
  };
});
