/**
 * Transfers: validate a transfer request and turn it into a transfer.
 *
 * A request looks like this (amounts are integer cents):
 *   { fromIban: 'NL20WGBK0123456789', toIban: 'FR7630006000011234567890189',
 *     beneficiaryName: 'Claire Dubois', amountCents: 12500, description: 'Invoice 2026-114', instant: false }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./iban'), require('./config'));
  } else {
    root.Woodgrove = root.Woodgrove || {};
    root.Woodgrove.transfer = factory(root.Woodgrove.iban, root.Woodgrove.config);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (iban, config) {
  'use strict';

  const { maxTransferCents, maxDescriptionLength } = config.limits;

  let sequence = 0;

  /** Check a transfer request. Returns { ok, errors } where each error is { code, message }. */
  function validateTransfer(req) {
    const request = req || {};
    const errors = [];
    const fail = (code, message) => errors.push({ code, message });

    if (!iban.isValidIban(request.fromIban)) {
      fail('INVALID_FROM_IBAN', 'The account you pay from is not a valid IBAN.');
    }

    if (!iban.isValidIban(request.toIban)) {
      fail('INVALID_TO_IBAN', 'The IBAN of the beneficiary is not valid. Check it for typos.');
    } else if (!iban.isSepaCountry(iban.countryOf(request.toIban))) {
      fail('NON_SEPA_COUNTRY', 'Transfers are only possible to accounts in the SEPA area.');
    }

    if (request.fromIban && iban.normalizeIban(request.fromIban) === iban.normalizeIban(request.toIban)) {
      fail('SAME_ACCOUNT', 'You cannot transfer money to the account it comes from.');
    }

    if (typeof request.beneficiaryName !== 'string' || request.beneficiaryName.trim() === '') {
      fail('MISSING_BENEFICIARY_NAME', 'Enter the name of the beneficiary.');
    }

    if (!Number.isInteger(request.amountCents) || request.amountCents <= 0) {
      fail('INVALID_AMOUNT', 'Enter an amount greater than zero.');
    } else if (request.amountCents > maxTransferCents) {
      fail('AMOUNT_TOO_HIGH', 'The amount is above the limit of € 25.000,00 per transfer.');
    }

    if (String(request.description || '').length > maxDescriptionLength) {
      fail('DESCRIPTION_TOO_LONG', `The description can be at most ${maxDescriptionLength} characters.`);
    }

    return { ok: errors.length === 0, errors };
  }

  /** Validate a request and create a transfer with status ACCEPTED or REJECTED. */
  function createTransfer(req, now = new Date()) {
    const request = req || {};
    const { ok, errors } = validateTransfer(request);

    const transfer = {
      id: nextId(now),
      status: ok ? 'ACCEPTED' : 'REJECTED',
      errors,
      fromIban: iban.normalizeIban(request.fromIban),
      toIban: iban.normalizeIban(request.toIban),
      beneficiaryName: String(request.beneficiaryName || '').trim(),
      amountCents: request.amountCents,
      description: String(request.description || ''),
      instant: request.instant === true,
      createdAt: now.toISOString(),
    };

    console.log(
      `[transfers] ${transfer.id} ${transfer.status}: ${transfer.fromIban} -> ${transfer.toIban} ` +
        `(${transfer.beneficiaryName}), ${transfer.amountCents} cents`
    );

    return transfer;
  }

  /** TRF-YYYYMMDD-0001, TRF-YYYYMMDD-0002, … */
  function nextId(now) {
    sequence += 1;
    const day = now.toISOString().slice(0, 10).replace(/-/g, '');
    return `TRF-${day}-${String(sequence).padStart(4, '0')}`;
  }

  return {
    validateTransfer,
    createTransfer,
  };
});
