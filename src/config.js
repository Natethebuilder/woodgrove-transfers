/**
 * Configuration for Woodgrove Transfers.
 */
(function (root, factory) {
  const env = typeof process !== 'undefined' && process.env ? process.env : {};
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(env);
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.config = factory(env);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (env) {
  'use strict';

  return Object.freeze({
    limits: Object.freeze({
      // € 25.000,00 per transfer
      maxTransferCents: 2_500_000,
      maxDescriptionLength: 140,
    }),

    // Instant transfer fee: 0.1% of the amount, between € 0,20 and € 2,50 (WGB-104).
    fees: Object.freeze({
      instant: Object.freeze({ minCents: 20, maxCents: 250 }),
    }),

    // Sanctions screening service, called by the nightly screening job.
    // The API key comes from the environment and is never stored in the repository (WGB-103).
    screening: Object.freeze({
      url: 'https://screening.woodgrove.example/v2/check',
      apiKey: env.WGB_SCREENING_API_KEY || '',
      timeoutMs: 2000,
    }),
  });
});
