describe('transfer', () => {
  const { validateTransfer, createTransfer, calculateFee } = Woodgrove.transfer;

  const validRequest = () => ({
    fromIban: 'NL20WGBK0123456789',
    toIban: 'FR7630006000011234567890189',
    beneficiaryName: 'Claire Dubois',
    amountCents: 12500,
    description: 'Invoice 2026-114',
    instant: false,
  });

  const codesOf = (request) => validateTransfer(request).errors.map((error) => error.code);

  test('a valid request has no errors', () => {
    expect(validateTransfer(validRequest())).toEqual({ ok: true, errors: [] });
  });

  test('every error has a code and a plain-English message', () => {
    const { ok, errors } = validateTransfer({});
    expect(ok).toBe(false);
    expect(errors.length).toBeGreaterThan(0);
    for (const error of errors) {
      expect(error.code).toMatch(/^[A-Z_]+$/);
      expect(error.message.length).toBeGreaterThan(10);
    }
  });

  test('rejects an invalid beneficiary IBAN', () => {
    expect(codesOf({ ...validRequest(), toIban: 'FR7630006000011234567890188' })).toEqual(['INVALID_TO_IBAN']);
  });

  test('rejects a transfer to the same account', () => {
    const request = { ...validRequest(), toIban: 'NL20WGBK0123456789' };
    expect(codesOf(request)).toEqual(['SAME_ACCOUNT']);
  });

  test('rejects the same account written with spaces or lowercase letters', () => {
    const request = { ...validRequest(), toIban: 'nl20 wgbk 0123 4567 89' };
    expect(codesOf(request)).toEqual(['SAME_ACCOUNT']);
  });

  test('rejects an invalid account to pay from', () => {
    expect(codesOf({ ...validRequest(), fromIban: 'NL21WGBK0123456789' })).toEqual(['INVALID_FROM_IBAN']);
  });

  test('rejects beneficiaries outside the SEPA area', () => {
    expect(codesOf({ ...validRequest(), toIban: 'TR330006100519786457841326' })).toEqual(['NON_SEPA_COUNTRY']);
  });

  test('accepts exactly € 25.000,00 and a description of exactly 140 characters', () => {
    expect(codesOf({ ...validRequest(), amountCents: 2500000, description: 'x'.repeat(140) })).toEqual([]);
  });

  test('rejects a description longer than 140 characters', () => {
    expect(codesOf({ ...validRequest(), description: 'x'.repeat(141) })).toEqual(['DESCRIPTION_TOO_LONG']);
  });

  test('requires a beneficiary name', () => {
    expect(codesOf({ ...validRequest(), beneficiaryName: '' })).toEqual(['MISSING_BENEFICIARY_NAME']);
    expect(codesOf({ ...validRequest(), beneficiaryName: '   ' })).toEqual(['MISSING_BENEFICIARY_NAME']);
  });

  test('the amount must be a positive integer number of cents', () => {
    expect(codesOf({ ...validRequest(), amountCents: 0 })).toEqual(['INVALID_AMOUNT']);
    expect(codesOf({ ...validRequest(), amountCents: -100 })).toEqual(['INVALID_AMOUNT']);
    expect(codesOf({ ...validRequest(), amountCents: 12.5 })).toEqual(['INVALID_AMOUNT']);
    expect(codesOf({ ...validRequest(), amountCents: '12500' })).toEqual(['INVALID_AMOUNT']);
  });

  test('rejects amounts above € 25.000,00', () => {
    expect(codesOf({ ...validRequest(), amountCents: 3000000 })).toEqual(['AMOUNT_TOO_HIGH']);
  });

  test('createTransfer accepts a valid request', () => {
    const now = new Date('2026-11-25T09:15:00.000Z');
    const transfer = createTransfer({ ...validRequest(), toIban: 'fr76 3000 6000 0112 3456 7890 189' }, now);

    expect(transfer.status).toBe('ACCEPTED');
    expect(transfer.errors).toEqual([]);
    expect(transfer.id).toMatch(/^TRF-20261125-\d{4}$/);
    expect(transfer.toIban).toBe('FR7630006000011234567890189');
    expect(transfer.amountCents).toBe(12500);
    expect(transfer.instant).toBe(false);
    expect(transfer.createdAt).toBe('2026-11-25T09:15:00.000Z');
  });

  test('createTransfer gives every transfer its own id', () => {
    const first = createTransfer(validRequest());
    const second = createTransfer(validRequest());
    expect(first.id).not.toBe(second.id);
  });

  test('createTransfer rejects an invalid request and lists the errors', () => {
    const transfer = createTransfer({ ...validRequest(), amountCents: 0 });
    expect(transfer.status).toBe('REJECTED');
    expect(transfer.errors.map((error) => error.code)).toEqual(['INVALID_AMOUNT']);
  });

  describe('instant fee (WGB-104)', () => {
    const feeFor = (amountCents, instant) => createTransfer({ ...validRequest(), amountCents, instant }).feeCents;

    test('€ 100,00 instant costs the minimum of € 0,20', () => {
      expect(feeFor(10000, true)).toBe(20);
    });

    test('€ 1.234,56 instant costs € 1,23', () => {
      expect(feeFor(123456, true)).toBe(123);
    });

    test('€ 10.000,00 instant costs the maximum of € 2,50', () => {
      expect(feeFor(1000000, true)).toBe(250);
    });

    test('standard transfers are free', () => {
      expect(feeFor(50000, false)).toBe(0);
    });

    test('rounds half up to whole cents', () => {
      expect(calculateFee(123500, true)).toBe(124);
      expect(calculateFee(123499, true)).toBe(123);
    });

    test('an invalid amount has no fee', () => {
      expect(calculateFee(0, true)).toBe(0);
      expect(calculateFee(Number.NaN, true)).toBe(0);
    });
  });

  test('createTransfer logs masked IBANs and no names', () => {
    const logs = [];
    const originalLog = console.log;
    console.log = (line) => logs.push(line);
    try {
      createTransfer(validRequest());
    } finally {
      console.log = originalLog;
    }
    const output = logs.join('\n');
    expect(output).toContain('NL************6789');
    expect(output).not.toContain('NL20WGBK0123456789');
    expect(output).not.toContain('Claire Dubois');
  });
});
