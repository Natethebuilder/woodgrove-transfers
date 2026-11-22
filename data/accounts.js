/**
 * Woodgrove Bank account directory: IBAN → account holder name.
 *
 * Fictional data for the workshop. Woodgrove's Dutch IBANs use the fake bank code WGBK.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.accounts = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  return Object.freeze({
    NL20WGBK0123456789: 'Jan de Vries',
    NL12WGBK0417164300: 'Sophie Bakker',
    NL49WGBK1234567890: 'Daan Visser',
    NL73WGBK5550001234: 'Woodgrove Coffee Roasters B.V.',
    NL54WGBK9876543210: 'Émilie van den Berg',
    NL17WGBK2468013579: 'Lucas Smit',
  });
});
