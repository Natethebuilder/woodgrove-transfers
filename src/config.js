/**
 * Configuration for Woodgrove Transfers.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.config = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  return Object.freeze({
    limits: Object.freeze({
      // € 25.000,00 per transfer
      maxTransferCents: 2_500_000,
      maxDescriptionLength: 140,
    }),

    // Sanctions screening service, called by the nightly screening job.
    screening: Object.freeze({
      url: 'https://screening.woodgrove.example/v2/check',
      apiKey: 'wgb_live_7f3a9c2e5b8d41f6a0c3e9d27b5f8a14',
      timeoutMs: 2000,
    }),
  });
});
