describe('transfer', () => {
  const { validateTransfer, createTransfer } = Woodgrove.transfer;

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
});
